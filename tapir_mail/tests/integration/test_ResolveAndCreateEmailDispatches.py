from datetime import datetime, timezone
from unittest.mock import patch

from dateutil.relativedelta import relativedelta

from tapir_mail.models import (
    EmailConfigurationDispatch,
    EmailDispatch,
    ReleaseStatus,
)
from tapir_mail.service.email_dispatch import ResolveAndCreateEmailDispatches
from tapir_mail.tests.factories import (
    EmailConfigurationVersionFactory,
    StaticSegmentFactory,
    StaticSegmentRecipientFactory,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest, mock_timezone_now


class ResolveAndCreateEmailDispatchesTest(TapirIntegrationTest):
    NOW = datetime(2023, 9, 10, 12, 30, tzinfo=timezone.utc)
    TEST_SEGMENT_DATA = {"static_segments": ["Test Segment"]}
    RECIPIENT_COUNT = 10

    def setUp(self):
        mock_timezone_now(self, self.NOW)
        self.email_config_version = EmailConfigurationVersionFactory.create(
            status=ReleaseStatus.RELEASED,
        )
        self.segment = StaticSegmentFactory.create(name="Test Segment")
        for i in range(self.RECIPIENT_COUNT):
            StaticSegmentRecipientFactory.create(
                segment=self.segment,
            )

    def create_email_config_dispatch(self, scheduled_time, is_sent=False):
        return EmailConfigurationDispatch.objects.create(
            email_configuration_version=self.email_config_version,
            scheduled_time=scheduled_time,
            is_sent=is_sent,
        )

    def test_resolveAndCreate_normalCase_createsDispatches(self):
        self.create_email_config_dispatch(scheduled_time=self.NOW)
        self.email_config_version.segment_data = self.TEST_SEGMENT_DATA
        self.email_config_version.save()
        ResolveAndCreateEmailDispatches.resolve_and_create()
        self.assertEqual(EmailDispatch.objects.count(), self.RECIPIENT_COUNT)

    def test_resolveAndCreate_noConfigDispatches_noDispatchesCreated(self):
        ResolveAndCreateEmailDispatches.resolve_and_create()
        self.assertEqual(EmailDispatch.objects.count(), 0)

    @patch("tapir_mail.service.email_dispatch.LOG.error")
    def test_resolveAndCreate_noRecipients_noDispatchesCreated(self, mock_log_error):
        config_dispatch = self.create_email_config_dispatch(scheduled_time=self.NOW)
        config_dispatch.override_recipients = []
        config_dispatch.save()
        ResolveAndCreateEmailDispatches.resolve_and_create()
        self.assertEqual(EmailDispatch.objects.count(), 0)
        mock_log_error.assert_called_once()

    @patch("tapir_mail.service.email_dispatch.LOG.error")
    def test_resolveAndCreate_errorCreatingDispatches_logsError(self, mock_log_error):
        config_dispatch = self.create_email_config_dispatch(scheduled_time=self.NOW)
        config_dispatch.email_configuration_version.segment_data = None
        config_dispatch.email_configuration_version.save()
        ResolveAndCreateEmailDispatches.resolve_and_create()
        mock_log_error.assert_called_once()

    def test_createEmailDispatches_noSegmentData_raisesValueError(self):
        config_dispatch = self.create_email_config_dispatch(scheduled_time=self.NOW)
        config_dispatch.email_configuration_version.segment_data = None
        config_dispatch.email_configuration_version.save()
        with self.assertRaises(ValueError):
            ResolveAndCreateEmailDispatches._create_email_dispatches(config_dispatch)

    def test_createEmailDispatches_noRecipients_raisesValueError(self):
        config_dispatch = self.create_email_config_dispatch(scheduled_time=self.NOW)
        config_dispatch.override_recipients = []
        config_dispatch.save()
        with self.assertRaises(ValueError):
            ResolveAndCreateEmailDispatches._create_email_dispatches(config_dispatch)

    def test_getEmailConfigurationDispatchesThatShouldBeSent_normalCase_returnsDispatches(
        self,
    ):
        for _ in range(10):
            self.create_email_config_dispatch(scheduled_time=self.NOW)
        result = (
            ResolveAndCreateEmailDispatches._get_email_configuration_dispatches_that_should_be_sent()
        )
        self.assertEqual(len(result), 10)

    @patch("tapir_mail.service.email_dispatch.LOG.error")
    def test_resolveAndCreate_alreadySent_noDispatchesCreated(self, mock_log_error):
        self.create_email_config_dispatch(scheduled_time=self.NOW, is_sent=True)
        ResolveAndCreateEmailDispatches.resolve_and_create()
        self.assertEqual(EmailDispatch.objects.count(), 0)
        mock_log_error.assert_not_called()

    @patch("tapir_mail.service.email_dispatch.LOG.error")
    def test_resolveAndCreate_scheduledFuture_noDispatchesCreated(self, mock_log_error):
        future_time = self.NOW + relativedelta(days=1)
        self.create_email_config_dispatch(scheduled_time=future_time)
        ResolveAndCreateEmailDispatches.resolve_and_create()
        self.assertEqual(EmailDispatch.objects.count(), 0)
        mock_log_error.assert_not_called()

    def test_resolveAndCreate_moreThan10Dispatches_only10Processed(self):
        self.email_config_version.segment_data = self.TEST_SEGMENT_DATA
        self.email_config_version.save()
        for _ in range(15):
            self.create_email_config_dispatch(scheduled_time=self.NOW)
        ResolveAndCreateEmailDispatches.resolve_and_create()
        self.assertEqual(EmailDispatch.objects.count(), 10 * self.RECIPIENT_COUNT)

    @patch("tapir_mail.service.email_dispatch.LOG.error")
    def test_resolveAndCreate_notReleased_noDispatchesCreated(self, mock_log_error):
        self.email_config_version.status = ReleaseStatus.DRAFT
        self.email_config_version.save()
        self.create_email_config_dispatch(scheduled_time=self.NOW)
        ResolveAndCreateEmailDispatches.resolve_and_create()
        self.assertEqual(EmailDispatch.objects.count(), 0)
        mock_log_error.assert_not_called()
