from unittest.mock import patch, Mock, call

from tapir_mail.service.email_bounces import EmailBounces
from tapir_mail.tests.test_utils import TapirUnitTest
from tapir_mail_server import settings


class TestEmailBounces(TapirUnitTest):
    @patch("tapir_mail.service.email_bounces.IMAP4_SSL")
    def test_checkForBounces_searchFails_raisesException(
        self, mock_mail_client_constructor: Mock
    ):
        mock_mail_client = Mock()
        mock_mail_client_constructor.return_value = mock_mail_client
        mock_mail_client.search.return_value = ("ERROR", [])

        with self.assertRaises(Exception):
            EmailBounces.check_for_bounces()

        mock_mail_client.login.assert_called_once_with(
            settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD
        )
        mock_mail_client.select.assert_called_once_with(readonly=True)
        mock_mail_client_constructor.assert_called_once_with(
            settings.EMAIL_HOST, port=settings.EMAIL_PORT_IMAP
        )
        mock_mail_client.search.assert_called_once_with(None, "(UNSEEN)")

    @patch("tapir_mail.service.email_bounces.IMAP4_SSL")
    @patch("tapir_mail.service.email_bounces.EmailBounces.process_message")
    def test_checkForBounces_default_processesAllMessagesReturnedByImapSearch(
        self, mock_process_message: Mock, mock_mail_client_constructor: Mock
    ):
        mock_mail_client = Mock()
        mock_mail_client_constructor.return_value = mock_mail_client
        mock_mail_client.search.return_value = ("OK", ["a b c", "d e f"])

        EmailBounces.check_for_bounces()

        mock_mail_client.login.assert_called_once_with(
            settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD
        )
        mock_mail_client.select.assert_called_once_with(readonly=True)
        mock_mail_client_constructor.assert_called_once_with(
            settings.EMAIL_HOST, port=settings.EMAIL_PORT_IMAP
        )
        mock_mail_client.search.assert_called_once_with(None, "(UNSEEN)")
        self.assertEqual(6, mock_process_message.call_count)
        mock_process_message.assert_has_calls(
            [
                call(mock_mail_client, message_id)
                for message_id in ["a", "b", "c", "d", "e", "f"]
            ]
        )
