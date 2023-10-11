import logging
import traceback
from collections import deque

from django.db.models import Q

from tapir_mail_server.dummy_accounts.models import DummyTapirUser

LOG = logging.getLogger(__name__)

BASE_QUERYSET = DummyTapirUser.objects.all()

segment_registry = {"Alle Benutzer": (lambda: DummyTapirUser.objects.all())}
filter_registry = {}


def register_segment(name, func):
    LOG.info(f"Registering segment {name}")
    segment_registry[name] = func


def register_filter(name, func):
    LOG.info(f"Registering filter {name}")
    filter_registry[name] = func


def _apply_complex_filters(queryset, filter_list):
    stack = deque()
    complex_filter = Q()
    not_flag = False

    for item in filter_list:
        if item == "(":
            stack.append((complex_filter, not_flag))
            stack.append(None)
            complex_filter = Q()
            not_flag = False
        elif item == ")":
            last_filter = complex_filter if not not_flag else ~complex_filter
            not_flag = False
            complex_filter, not_flag = stack.pop()
            operator = stack.pop()
            if operator == "AND":
                complex_filter &= last_filter
            elif operator == "OR":
                complex_filter |= last_filter
        elif item == "NOT":
            not_flag = not not_flag
        elif item in ["AND", "OR"]:
            stack.append((complex_filter, not_flag))
            stack.append(item)
            complex_filter = Q()
            not_flag = False
        else:
            new_filter = filter_registry[item](BASE_QUERYSET.all())
            new_q = Q(id__in=new_filter)
            if not_flag:
                new_q = ~new_q
                not_flag = False

            if stack and stack[-1] in ["AND", "OR"]:
                operator = stack.pop()
                last_filter, last_not_flag = stack.pop()
                last_filter = last_filter if not last_not_flag else ~last_filter
                if operator == "AND":
                    complex_filter = last_filter & new_q
                elif operator == "OR":
                    complex_filter = last_filter | new_q
            else:
                if complex_filter:
                    complex_filter &= new_q
                else:
                    complex_filter = new_q

    if not_flag:
        complex_filter = ~complex_filter

    return queryset.filter(complex_filter)


def combine_segments_with_filters(
    add_segments=None, static_segments=None, remove_segments=None, filter_list=None
):
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
        print(static_segments)
        for segment in static_segments:
            LOG.info(f"Adding static segment {segment.name}")
            result.extend(segment.recipients.all())

        return result
    except Exception as e:
        LOG.error(
            f"Error combining segments: {e}. addSegments: {add_segments}, removeSegments: {remove_segments}, filterList: {filter_list}"
        )
        traceback.print_exc()
        raise e
