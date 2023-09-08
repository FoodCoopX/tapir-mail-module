import factory.random
from django.test import TestCase, Client
from rest_framework.test import APIClient


class TapirFactoryTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()
        factory.random.reseed_random(self.__class__.__name__)


class TapirIntegrationTest(TapirFactoryTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client = Client()
        self.apiClient = APIClient()
