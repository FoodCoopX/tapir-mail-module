from datetime import datetime, timezone
from unittest.mock import patch

from dateutil.relativedelta import relativedelta
from django.conf import settings
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
        self, count, config_dispatch=None, sent_time=None, created_at=None
    ):
        dispatches = []
        for i in range(count):
            dispatches.append(
                EmailDispatchFactory.create(
                    email_configuration_dispatch=config_dispatch
                    if config_dispatch
                    else self.config_dispatch,
                    recipient=f"test{i}@example.com",
                    sent_time=sent_time,
                )
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

    def test_sendEmailDispatches_errorSendingEmail_logsError(self):
        self.create_email_dispatches(1)
        with patch(
            "tapir_mail.service.email_dispatch.send_email",
            side_effect=Exception("Test exception"),
        ) as mock_send_email, patch(
            "tapir_mail.service.email_dispatch.LOG.error"
        ) as mock_log_error:
            SendEmailBatch.send_email_dispatches()
        mock_log_error.assert_called_once_with(
            "Error while sending email to test0@example.com: Test exception"
        )

    def test_sendEmailDispatches_alreadySent_noEmailsSent(self):
        self.create_email_dispatches(10, sent_time=self.NOW)
        SendEmailBatch.send_email_dispatches()
        self.assertEqual(len(mail.outbox), 0)

    def test_sendEmailDispatches_batchSizeLimit_onlyLimitSent(self):
        self.create_email_dispatches(60)
        SendEmailBatch.send_email_dispatches(batch_size=50)
        self.assertEqual(len(mail.outbox), 50)
        self.assertEqual(
            EmailDispatch.objects.filter(sent_time__isnull=True).count(), 10
        )

    def test_sendEmailDispatches_severalConfigurationsCouldBeSent_oldestGetsSent(self):
        newer_config_dispatch = EmailConfigurationDispatchFactory.create(
            email_configuration_version=self.email_config_version,
        )
        older_config_dispatch = EmailConfigurationDispatchFactory.create(
            email_configuration_version=self.email_config_version,
        )

        newer_dispatches = self.create_email_dispatches(
            10, config_dispatch=newer_config_dispatch, created_at=self.NOW
        )
        older_dispatches = self.create_email_dispatches(
            10,
            config_dispatch=older_config_dispatch,
            created_at=self.NOW - relativedelta(days=2),
        )

        SendEmailBatch.send_email_dispatches(batch_size=10)

        self.assertEqual(len(mail.outbox), 10)
        older_recipients = {dispatch.recipient for dispatch in older_dispatches}

        for email in mail.outbox:
            self.assertTrue(email.to[0] in older_recipients)

        self.assertEqual(
            set(EmailDispatch.objects.filter(sent_time__isnull=True)),
            set(newer_dispatches),
        )
