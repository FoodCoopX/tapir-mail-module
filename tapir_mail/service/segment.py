import logging
import traceback
from collections import deque

from django.db.models import Q

LOG = logging.getLogger(__name__)

BASE_QUERYSET = None

segment_registry = {}
filter_registry = {}


def _check_base_queryset():
    if BASE_QUERYSET is None:
        raise ValueError(
            "Base queryset not set. Please call register_base_segment first."
        )


def register_base_segment(queryset):
    global BASE_QUERYSET
    BASE_QUERYSET = queryset
    segment_registry["Alle Benutzer"] = lambda: queryset.all()


def register_segment(name, func):
    _check_base_queryset()

    LOG.info(f"Registering segment {name}")
    segment_registry[name] = func


def register_filter(name, func):
    _check_base_queryset()

    LOG.info(f"Registering filter {name}")
    filter_registry[name] = func


def _apply_top_operator(operator_stack, operand_stack):
    if not operator_stack:
        return

    operator = operator_stack.pop()
    if operator == "NOT":
        if operand_stack:
            operand_stack.append(~operand_stack.pop())
        else:
            raise ValueError("Missing operand for NOT")
    else:
        if len(operand_stack) >= 2:
            right = operand_stack.pop()
            left = operand_stack.pop()
            if operator == "AND":
                operand_stack.append(left & right)
            elif operator == "OR":
                operand_stack.append(left | right)
        else:
            raise ValueError("Missing operand for AND/OR")


def _apply_complex_filters(queryset, filter_list):
    operator_stack = deque()
    operand_stack = deque()

    for item in filter_list:
        if item == "(":
            operator_stack.append(item)
        elif item == ")":
            while operator_stack and operator_stack[-1] != "(":
                _apply_top_operator(operator_stack, operand_stack)
            if operator_stack:
                operator_stack.pop()
            else:
                raise ValueError("Mismatched parentheses")
        elif item in ["AND", "OR", "NOT"]:
            while operator_stack and _precedence(item) <= _precedence(
                operator_stack[-1]
            ):
                _apply_top_operator(operator_stack, operand_stack)
            operator_stack.append(item)
        else:
            if item not in filter_registry:
                raise ValueError(f"Unknown filter or operand: {item}")

            new_filter = filter_registry[item](queryset)
            operand_stack.append(Q(id__in=new_filter.values_list("id", flat=True)))

    while operator_stack:
        _apply_top_operator(operator_stack, operand_stack)

    if operand_stack:
        return queryset.filter(operand_stack.pop())
    else:
        return queryset  # return the original queryset if operand_stack is empty


def _precedence(operator):
    if operator == "NOT":
        return 3
    elif operator == "AND":
        return 2
    elif operator == "OR":
        return 1
    elif operator == "(":
        return 0


def resolve_segments(
    add_segments=None,
    static_segments=None,
    remove_segments=None,
    filter_list=None,
    override_recipients: list[str] = None,
) -> list:
    if filter_list is None:
        filter_list = []
    if remove_segments is None:
        remove_segments = []
    if static_segments is None:
        static_segments = []
    if add_segments is None:
        add_segments = []

    from tapir_mail.models import StaticSegment

    if not add_segments and not static_segments:
        raise ValueError("At least one segment should be added.")

    try:
        combined = BASE_QUERYSET.none()

        # Start with override recipients if set, to avoid unnecessary DB queries
        if override_recipients:
            combined = combined.filter(email__in=override_recipients)

        # Combine segments using union
        for segment in add_segments:
            LOG.info(f"Adding segment {segment}")
            combined = combined.union(segment_registry[segment]())

        # Subtract segments using difference
        for segment in remove_segments:
            LOG.info(f"Subtracting segment {segment}")
            combined = combined.difference(segment_registry[segment]())

        # Apply complex filters
        if filter_list:
            LOG.info(f"Adding filters {filter_list}")
            id_list = list(combined.values_list("id", flat=True))
            combined = _apply_complex_filters(
                BASE_QUERYSET.filter(id__in=id_list), filter_list
            )

        result = list(combined)

        # Add static segments
        static_segments = StaticSegment.objects.filter(name__in=static_segments)
        for segment in static_segments:
            LOG.info(f"Adding static segment {segment.name}")
            result.extend(segment.recipients.all())

        # apply override recipients again, to filter out static segment recipients
        if override_recipients:
            result = [r for r in result if r.email in override_recipients]

        return result
    except Exception as e:
        LOG.error(
            f"Error combining segments: {e}. addSegments: {add_segments}, removeSegments: {remove_segments}, filterList: {filter_list}"
        )
        traceback.print_exc()
        raise e
