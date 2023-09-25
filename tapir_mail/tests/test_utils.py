import datetime
import unittest
from unittest.mock import patch

import factory.random
from django.core.cache import cache
from django.test import TestCase, Client, SimpleTestCase
from rest_framework.test import APIClient


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


class TapirUnitTest(TapirFactoryMixin, SimpleTestCase):
    def setUp(self) -> None:
        self.factory_setup()


def mock_timezone_now(test: unittest.TestCase, now: datetime.datetime) -> None:
    patcher = patch("django.utils.timezone.now")
    test.mock_now = patcher.start()
    test.addCleanup(patcher.stop)
    test.mock_now.return_value = now
