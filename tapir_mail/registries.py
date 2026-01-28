from typing import Callable

from django.db.models import QuerySet

segment_registry: dict[str, Callable[[], QuerySet]] = {}
filter_registry = {}
