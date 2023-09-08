from types import SimpleNamespace
from unittest.mock import patch, Mock

from django.http import Http404
from rest_framework.response import Response

from tapir_mail.models import EmailConfiguration
from tapir_mail.serializers import (
    EmailConfigurationCreateSerializer,
    EmailConfigurationSerializer,
)
from tapir_mail.tests.test_utils import TapirFactoryTestCase
from tapir_mail.views import EmailConfigurationViewSet


class TestEmailConfiguration(TapirFactoryTestCase):
    def test_getSerializerClass_updateAction_returnsCreateSerializer(self):
        serializer = EmailConfigurationViewSet()
        serializer.action = "update"
        self.assertEqual(
            EmailConfigurationCreateSerializer, serializer.get_serializer_class()
        )

    def test_getSerializerClass_createAction_returnsCreateSerializer(self):
        serializer = EmailConfigurationViewSet()
        serializer.action = "create"
        self.assertEqual(
            EmailConfigurationCreateSerializer, serializer.get_serializer_class()
        )

    def test_getSerializerClass_otherAction_returnsCreateSerializer(self):
        serializer = EmailConfigurationViewSet()
        serializer.action = "delete"
        self.assertEqual(
            EmailConfigurationSerializer, serializer.get_serializer_class()
        )

    @patch("tapir_mail.views.get_object_or_404")
    def test_sendTestEmail_emailConfigurationDoesntExist_throwsException(
        self, mock_get_object_or_404: Mock
    ):
        exception_class = Http404
        mock_get_object_or_404.side_effect = exception_class("TestException")
        email_configuration_id = 123
        with self.assertRaises(exception_class):
            EmailConfigurationViewSet().send_test_email(None, email_configuration_id)

    def test_sendTestMail_invalidRecipient_returns400Response(self):
        for recipients in [
            None,  # no recipients
            [["test@test.de", 1]],  # invalid recipient
        ]:
            with self.subTest(recipients=recipients):
                mock_request = Mock()
                mock_request.data.get.return_value = recipients
                email_configuration_id = 123
                patcher = patch("tapir_mail.views.get_object_or_404")
                mock_get_object_or_404 = patcher.start()
                self.addCleanup(patcher.stop)

                response = EmailConfigurationViewSet().send_test_email(
                    mock_request, email_configuration_id
                )

                mock_get_object_or_404.assert_called_once_with(
                    EmailConfiguration, id=email_configuration_id
                )
                mock_request.data.get.assert_called_once_with("recipients", None)
                self.assertIsInstance(response, Response)
                self.assertEqual(400, response.status_code)

    @patch("tapir_mail.views.send_email")
    @patch("tapir_mail.views.get_object_or_404")
    def test_sendTestMail_validRecipient_sendsMailAndReturns200Response(
        self,
        mock_get_object_or_404: Mock,
        mock_send_mail: Mock,
    ):
        mock_request = Mock()
        recipients = ["test@test.de", "test2@mail.de"]
        mock_request.data.get.return_value = recipients
        email_configuration_id = 123
        email_configuration = SimpleNamespace(
            template="TEST_TEMPLATE", subject="TEST_SUBJECT", subtitle="TEST_SUBTITLE"
        )
        mock_get_object_or_404.return_value = email_configuration

        response = EmailConfigurationViewSet().send_test_email(
            mock_request, email_configuration_id
        )

        mock_get_object_or_404.assert_called_once_with(
            EmailConfiguration, id=email_configuration_id
        )
        mock_request.data.get.assert_called_once_with("recipients", None)
        self.assertIsInstance(response, Response)
        self.assertEqual(200, response.status_code)
        mock_send_mail.assert_called_once_with(
            template=email_configuration.template,
            subject=email_configuration.subject,
            subtitle=email_configuration.subtitle,
            recipients=recipients,
        )
