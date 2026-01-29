import logging
import traceback
from collections import deque
from typing import Any

from django.db.models import Q, QuerySet

from tapir_mail.exceptions import TapirMailException
from tapir_mail.models import StaticSegment, MailCategory
from tapir_mail.registries import segment_registry, filter_registry
from tapir_mail.service.mail_category_recipients_resolver import (
    MailCategoryRecipientResolver,
)
from tapir_mail.triggers.transactional_trigger import TransactionalTriggerData

LOG = logging.getLogger(__name__)

BASE_QUERYSET: QuerySet | None = None


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
        apply_filter(item, operand_stack, operator_stack, queryset)

    while operator_stack:
        _apply_top_operator(operator_stack, operand_stack)

    if operand_stack:
        return queryset.filter(operand_stack.pop())
    else:
        return queryset  # return the original queryset if operand_stack is empty


def apply_filter(item, operand_stack: deque[Any], operator_stack: deque[Any], queryset):
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
        while operator_stack and _precedence(item) <= _precedence(operator_stack[-1]):
            _apply_top_operator(operator_stack, operand_stack)
        operator_stack.append(item)
    else:
        if item not in filter_registry:
            raise ValueError(f"Unknown filter or operand: {item}")

        new_filter = filter_registry[item](queryset)
        operand_stack.append(Q(id__in=new_filter.values_list("id", flat=True)))


def _precedence(operator):
    if operator == "NOT":
        return 3
    elif operator == "AND":
        return 2
    elif operator == "OR":
        return 1
    elif operator == "(":
        return 0
    raise TapirMailException("Unknown operator " + operator)


def resolve_segments(
    add_segments=None,
    static_segments=None,
    static_segments_subtractive=None,
    remove_segments=None,
    filter_list=None,
    mail_category_ids=None,
    override_recipients: list = None,
) -> list:
    if filter_list is None:
        filter_list = []
    if remove_segments is None:
        remove_segments = []
    if static_segments is None:
        static_segments = []
    if add_segments is None:
        add_segments = []
    if static_segments_subtractive is None:
        static_segments_subtractive = []
    if mail_category_ids is None:
        mail_category_ids = []

    if (
        not add_segments
        and not static_segments
        and not mail_category_ids
        and not override_recipients
    ):
        raise ValueError("At least one segment should be added.")

    try:
        return __resolve_segments_internal(
            add_segment_names=add_segments,
            static_segment_names=static_segments,
            static_segment_subtractive_names=static_segments_subtractive,
            remove_segment_names=remove_segments,
            filter_list=filter_list,
            override_recipients=override_recipients,
            mail_category_ids=mail_category_ids,
        )
    except Exception as e:
        LOG.error(
            f"Error combining segments: {e}. addSegments: {add_segments}, removeSegments: {remove_segments}, filterList: {filter_list}, override_recipients: {override_recipients}"
        )
        traceback.print_exc()
        raise e


def __resolve_segments_internal(
    add_segment_names: list[str],
    static_segment_names: list[str],
    static_segment_subtractive_names: list[str],
    remove_segment_names: list[str],
    filter_list: list,
    mail_category_ids: list[str],
    override_recipients: list = None,
):
    combined = BASE_QUERYSET.none()

    # Combine segments using union
    for segment_name in add_segment_names:
        LOG.info(f"Adding segment {segment_name}")
        combined = combined.union(segment_registry[segment_name]())

    # Subtract segments using difference
    for segment_name in remove_segment_names:
        LOG.info(f"Subtracting segment {segment_name}")
        combined = combined.difference(segment_registry[segment_name]())

    # Apply complex filters
    if filter_list:
        LOG.info(f"Adding filters {filter_list}")
        id_list = list(combined.values_list("id", flat=True))
        combined = _apply_complex_filters(
            BASE_QUERYSET.filter(id__in=id_list), filter_list
        )

    # Can't call distinct() right away because we called difference() before on combined
    ids = combined.values_list("id", flat=True)
    combined = BASE_QUERYSET.filter(id__in=ids).distinct()

    result = list(combined)

    for mail_category_id in mail_category_ids:
        mail_category = MailCategory.objects.get(id=mail_category_id)
        result.extend(MailCategoryRecipientResolver.resolve_recipients(mail_category))

    # Add static segments
    static_segment_names = StaticSegment.objects.filter(name__in=static_segment_names)
    for segment_name in static_segment_names:
        LOG.info(f"Adding static segment {segment_name.name}")
        result.extend(segment_name.recipients.all())

    recipients_subtractive = []
    for static_segment_subtractive in StaticSegment.objects.filter(
        name__in=static_segment_subtractive_names
    ):
        recipients_subtractive.extend(
            static_segment_subtractive.recipients.values_list("email", flat=True)
        )

    result = [
        recipient
        for recipient in result
        if recipient.email not in recipients_subtractive
    ]

    if override_recipients:
        result = apply_recipient_override(result, override_recipients)

    return result


def apply_recipient_override(recipients: list, overrides: list[dict]) -> list:
    updated_recipients = []
    for override in overrides:
        recipient_outside_of_base_queryset = override.get(
            "recipient_outside_of_base_queryset", None
        )
        if recipient_outside_of_base_queryset is not None:
            return [
                TransactionalTriggerData.RecipientOutsideOfBaseQueryset(
                    **override.get("recipient_outside_of_base_queryset")
                )
            ]

        recipient_id_in_base_queryset = override.get(
            "recipient_id_in_base_queryset", None
        )

        found_recipient = next(
            (
                recipient
                for recipient in recipients
                if getattr(recipient, "id", None) == recipient_id_in_base_queryset
            ),
            None,
        )
        if found_recipient is not None:
            updated_recipients.append(found_recipient)

    return updated_recipients
