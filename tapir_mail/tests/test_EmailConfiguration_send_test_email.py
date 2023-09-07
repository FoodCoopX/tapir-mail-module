from django.core import mail

from tapir_mail.models import EmailConfiguration
from tapir_mail.tests.factories import EmailConfigurationFactory
from tapir_mail.tests.test_utils import TapirFactoryTestCase


class TestsEmailConfigurationSendTestEmail(TapirFactoryTestCase):
    def test_emailConfigurationDoesNotExist_returns404(self):
        self.assertEqual(0, EmailConfiguration.objects.count())
        response = self._send_request("abc", None)
        self.assertEqual(404, response.status_code)
        self.assertEqual(0, len(mail.outbox))

    def test_invalidFormData_returns400(self):
        EmailConfigurationFactory.create()
        response = self._send_request(
            EmailConfiguration.objects.first().id, {"invalid_parameter": "aaa"}
        )
        self.assertEqual(400, response.status_code)
        self.assertEqual(0, len(mail.outbox))

    def test_validRequest_emailIsSent(self):
        recipients = ["test@test.com", "foo@bar.net"]
        subject = "TEST SUBJECT"
        EmailConfigurationFactory.create(subject=subject)
        response = self._send_request(
            EmailConfiguration.objects.first().id,
            {"recipients": ["test@test.com", "foo@bar.net"]},
        )
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(mail.outbox))
        sent_mail = mail.outbox[0]
        self.assertIn("This is a dummy email!", sent_mail.body)
        self.assertEqual(recipients, sent_mail.to)
        self.assertEqual(subject, sent_mail.subject)

    def _send_request(self, email_configuration_id: str, post_data):
        return self.apiClient.post(
            f"/api/email_configuration/{email_configuration_id}/send_test_email/",
            data=post_data,
            format="json",
        )
