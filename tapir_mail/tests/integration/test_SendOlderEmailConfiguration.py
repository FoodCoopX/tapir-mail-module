import datetime

from django.core import mail
from django.core.cache import cache

from tapir_mail.models import ReleaseStatus, EmailConfigurationDispatch, EmailDispatch
from tapir_mail.service.send_oldest_email_configuration import (
    SendOldestEmailConfiguration,
)
from tapir_mail.tests.factories import EmailConfigurationDispatchFactory
from tapir_mail.tests.test_utils import TapirIntegrationTest, mock_timezone_now


class TestEmailConfigurationSendTestEmail(TapirIntegrationTest):
    NOW = datetime.datetime(
        year=2023, month=9, day=10, hour=12, minute=30, tzinfo=datetime.UTC
    )
    RECIPIENT_1 = "test1@test2.com"
    RECIPIENT_2 = "test3@test4.net"
    RECIPIENTS = [RECIPIENT_1, RECIPIENT_2]
    SUBJECT = "Test subject"

    def setUp(self) -> None:
        mock_timezone_now(self, self.NOW)
        cache.clear()

    def test_scheduledTimeIsInThePast_emailGetsSentWithTheCorrectContent(self):
        config_dispatch = self.create_config_that_would_be_sent()

        SendOldestEmailConfiguration.send_oldest_email_configuration()

        self.assertEqual(1, len(mail.outbox))
        sent_mail = mail.outbox[0]
        self.assertEqual(self.RECIPIENTS, sent_mail.recipients())
        self.assertEqual(self.SUBJECT, sent_mail.subject)
        self.assertIn("Test content", sent_mail.body)

        config_dispatch.refresh_from_db()
        self.assertTrue(config_dispatch.is_sent)
        self.assertEqual(2, EmailDispatch.objects.count())
        for index, recipient in enumerate(self.RECIPIENTS):
            dispatch = EmailDispatch.objects.all()[index]
            self.assertEqual(recipient, dispatch.recipient)
            self.assertEqual(self.NOW, dispatch.sent_time)
            self.assertEqual(config_dispatch, dispatch.email_configuration_dispatch)

    def test_scheduledTimeIsInTheFuture_emailDoesNotGetSent(self):
        config_dispatch = self.create_config_that_would_be_sent()
        config_dispatch.scheduled_time = self.NOW + datetime.timedelta(days=1)
        config_dispatch.save()

        SendOldestEmailConfiguration.send_oldest_email_configuration()

        self.assertEqual(0, len(mail.outbox))
        config_dispatch.refresh_from_db()
        self.assertFalse(config_dispatch.is_sent)
        self.assertEqual(0, EmailDispatch.objects.count())

    def test_configAlreadySent_emailDoesNotGetSent(self):
        config_dispatch = self.create_config_that_would_be_sent()
        config_dispatch.is_sent = True
        config_dispatch.save()

        SendOldestEmailConfiguration.send_oldest_email_configuration()

        self.assertEqual(0, len(mail.outbox))
        config_dispatch.refresh_from_db()
        self.assertEqual(0, EmailDispatch.objects.count())

    def test_default_lockIsReleasedAfterCall(self):
        SendOldestEmailConfiguration.send_oldest_email_configuration()
        self.assertFalse(cache.lock("send_oldest_email_configuration").locked())

    def test_severalConfigurationsCouldBeSent_oldestGetsSent(self):
        newer_config = self.create_config_that_would_be_sent()
        older_config = self.create_config_that_would_be_sent()
        older_config.scheduled_time = self.NOW - datetime.timedelta(days=2)
        older_config.save()
        SendOldestEmailConfiguration.send_oldest_email_configuration()

        newer_config.refresh_from_db()
        self.assertFalse(newer_config.is_sent)
        older_config.refresh_from_db()
        self.assertTrue(older_config.is_sent)

    def create_config_that_would_be_sent(self) -> EmailConfigurationDispatch:
        return EmailConfigurationDispatchFactory.create(
            recipients=f"{self.RECIPIENT_1},{self.RECIPIENT_2}",
            scheduled_time=self.NOW - datetime.timedelta(days=1),
            is_sent=False,
            email_configuration_version__status=ReleaseStatus.RELEASED,
            email_configuration_version__subject=self.SUBJECT,
            email_configuration_version__content="<mjml><mj-body><mj-text>Test content</mj-text></mj-body></mjml>",
        )
