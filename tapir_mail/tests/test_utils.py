import datetime
import unittest
from unittest.mock import patch

import factory.random
import faker
from django.core.cache import cache
from django.test import TestCase, Client, SimpleTestCase
from rest_framework.test import APIClient

from tapir_mail.triggers.time_trigger import TimeTrigger


class TapirFactoryMixin:
    def factory_setup(self) -> None:
        factory.random.reseed_random(self.__class__.__name__)


class TapirIntegrationTest(TapirFactoryMixin, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.factory_setup()
        self.client = Client()
        self.apiClient = APIClient()
        cache.clear()

    def assertStatusCode(self, response, expected_status_code):
        self.assertEqual(
            expected_status_code,
            response.status_code,
            f"Unexpected status code, response content : {response.content.decode()}",
        )


class TapirUnitTest(TapirFactoryMixin, SimpleTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.factory_setup()


def mock_timezone_now(test: unittest.TestCase, now: datetime.datetime) -> None:
    patcher = patch("django.utils.timezone.now")
    test.mock_now = patcher.start()
    test.addCleanup(patcher.stop)
    test.mock_now.return_value = now


def build_time_trigger_dict(scheduled_time: datetime.datetime | None = None):
    return {
        "trigger_id": TimeTrigger.get_id(),
        "trigger_field_values": {
            "scheduled_time": (
                scheduled_time.isoformat()
                if scheduled_time
                else faker.Faker().date_time_this_decade().isoformat()
            ),
        },
    }
