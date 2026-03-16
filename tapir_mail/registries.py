from typing import Callable

from django.db.models import QuerySet

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
