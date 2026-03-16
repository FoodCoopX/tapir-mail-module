from typing import Callable

from django.db.models import QuerySet

type MailSegmentFilter = Callable[[QuerySet], QuerySet]
type MailSegmentFilterRegistry = dict[str, MailSegmentFilter]
type MailSegmentFilterProvider = Callable[[], MailSegmentFilterRegistry]

mail_segment_filter_providers = set[MailSegmentFilterProvider]()


def get_mail_segment_filters() -> MailSegmentFilterRegistry:
    combined_registry = {}

    for provider in mail_segment_filter_providers:
        single_registry = provider()
        combined_registry.update(single_registry)

    return combined_registry


type MailSegment = Callable[[], QuerySet]
type MailSegmentRegistry = dict[str, MailSegment]
type MailSegmentRegistryProvider = Callable[[], MailSegmentRegistry]

mail_segment_providers = set[MailSegmentRegistryProvider]()


def get_mail_segments() -> MailSegmentRegistry:
    combined_registry = {}

    for provider in mail_segment_providers:
        single_registry = provider()
        combined_registry.update(single_registry)

    return combined_registry
