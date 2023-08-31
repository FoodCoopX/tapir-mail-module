from django.test import TestCase


class DummyTestClass(TestCase):
    def test_mediaLibrary_renders(self):
        response = self.client.get("/media_library")
        self.assertEqual(200, response.status_code)
