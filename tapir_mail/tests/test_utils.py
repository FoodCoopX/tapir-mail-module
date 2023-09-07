import factory.random
from django.test import TestCase, Client
from rest_framework.test import APIClient


class TapirFactoryTestCase(TestCase):
    def setUp(self) -> None:
        factory.random.reseed_random(self.__class__.__name__)
        self.client = Client()
        self.apiClient = APIClient()
