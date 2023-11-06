from datetime import datetime, timezone
from unittest.mock import patch

from dateutil.relativedelta import relativedelta
from django.core import mail

from tapir_mail.models import EmailDispatch, ReleaseStatus
from tapir_mail.service.email_dispatch import SendEmailBatch
from tapir_mail.tests.factories import (
    EmailConfigurationDispatchFactory,
    EmailConfigurationVersionFactory,
    EmailDispatchFactory,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest


class SendEmailBatchTest(TapirIntegrationTest):
    NOW = datetime(2023, 9, 10, 12, 30, tzinfo=timezone.utc)
    SUBJECT = "Test Subject"

    def setUp(self):
        self.email_config_version = EmailConfigurationVersionFactory.create(
            status=ReleaseStatus.RELEASED,
            subject=self.SUBJECT,
        )
        self.config_dispatch = EmailConfigurationDispatchFactory.create(
            email_configuration_version=self.email_config_version,
        )

    def create_email_dispatches(
        self,
        count,
        config_dispatch=None,
        sent_time=None,
        created_at=None,
        recipient_prefix="test",
    ):
        dispatches = EmailDispatch.objects.bulk_create(
            EmailDispatchFactory.build(
                email_configuration_dispatch=config_dispatch
                if config_dispatch
                else self.config_dispatch,
                recipient=f"{recipient_prefix}{i}@example.com",
                sent_time=sent_time,
            )
            for i in range(count)
        )

        if created_at is not None:
            EmailDispatch.objects.filter(id__in=[d.id for d in dispatches]).update(
                created_at=created_at
            )

        return dispatches

    def test_sendEmailDispatches_normalCase_sendsEmails(self):
        self.create_email_dispatches(10)
        SendEmailBatch.send_email_dispatches()
        self.assertEqual(
            EmailDispatch.objects.filter(sent_time__isnull=True).count(), 0
        )
        self.assertEqual(len(mail.outbox), 10)
        for i, email in enumerate(mail.outbox):
            self.assertEqual(email.to, [f"test{i}@example.com"])
            self.assertEqual(email.subject, self.SUBJECT)
            self.assertTrue("This is a dummy email!" in str(email.body))

    def test_sendEmailDispatches_noEmailDispatches_noEmailsSent(self):
        SendEmailBatch.send_email_dispatches()
        self.assertEqual(len(mail.outbox), 0)

        self.create_email_dispatches(1)

    def test_sendEmailDispatches_errorSendingEmail_logsError(self):
        self.create_email_dispatches(1)
        with patch(
            "tapir_mail.service.email_dispatch.prepare_email",
            side_effect=Exception("Test exception"),
        ):
            with patch("tapir_mail.service.email_dispatch.LOG.error") as mock_log_error:
                SendEmailBatch.send_email_dispatches()

                mock_log_error.assert_called_once_with(
                    "Error while preparing email to test0@example.com: Test exception"
                )

                self.assertEqual(len(mail.outbox), 0)
                self.assertTrue(
                    EmailDispatch.objects.filter(
                        error_message="Test exception"
                    ).exists()
                )

    def test_sendEmailDispatches_alreadySent_noEmailsSent(self):
        self.create_email_dispatches(10, sent_time=self.NOW)
        SendEmailBatch.send_email_dispatches()
        self.assertEqual(len(mail.outbox), 0)

    def test_sendEmailDispatches_batchSizeLimit_onlyLimitSent(self):
        self.create_email_dispatches(10)
        SendEmailBatch.send_email_dispatches(batch_size=4)
        self.assertEqual(len(mail.outbox), 4)
        self.assertEqual(
            EmailDispatch.objects.filter(sent_time__isnull=True).count(), 6
        )

    def test_sendEmailDispatches_severalConfigurationsCouldBeSent_oldestGetsSent(self):
        newer_config_dispatch = EmailConfigurationDispatchFactory.create(
            email_configuration_version=self.email_config_version,
        )
        older_config_dispatch = EmailConfigurationDispatchFactory.create(
            email_configuration_version=self.email_config_version,
        )

        newer_dispatches = self.create_email_dispatches(
            10,
            config_dispatch=newer_config_dispatch,
            created_at=self.NOW,
            recipient_prefix="new",
        )
        self.create_email_dispatches(
            10,
            config_dispatch=older_config_dispatch,
            created_at=self.NOW - relativedelta(days=2),
            recipient_prefix="old",
        )

        SendEmailBatch.send_email_dispatches(batch_size=10)

        self.assertEqual(len(mail.outbox), 10)

        for index, email in enumerate(mail.outbox):
            self.assertIn(f"old{index}@example.com", email.to[0])

        self.assertEqual(
            set(EmailDispatch.objects.filter(sent_time__isnull=True)),
            set(newer_dispatches),
        )
