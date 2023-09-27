import datetime
from unittest.mock import patch, Mock

from tapir_mail.models import EmailConfigurationDispatch, EmailDispatch
from tapir_mail.service.send_oldest_email_configuration import (
    SendOldestEmailConfiguration,
)
from tapir_mail.tests.factories import EmailConfigurationDispatchFactory
from tapir_mail.tests.test_utils import TapirUnitTest, mock_timezone_now


class TestSendOldestEmailConfiguration(TapirUnitTest):
    NOW = datetime.datetime(
        year=2023, month=9, day=10, hour=12, minute=30, tzinfo=datetime.UTC
    )
    RECIPIENT_1 = "recipient1@test.com"
    RECIPIENT_2 = "recipient2@test.net"
    CONTENT = "Test content"
    SUBJECT = "Test subject"
    SUBTITLE = "Test subtitle"

    @patch.object(EmailConfigurationDispatch, "objects")
    def test_getEmailConfigurationDispatchesThatShouldBeSent_returnsCorrectFilter(
        self, mock_dispatch_queryset: Mock
    ):
        mock_timezone_now(self, self.NOW)
        mock_dispatch_queryset.filter.return_value = object()

        result = (
            SendOldestEmailConfiguration._get_email_configuration_dispatches_that_should_be_sent()
        )

        mock_dispatch_queryset.filter.assert_called_once_with(
            is_sent=False,
            scheduled_time__lte=self.NOW,
            email_configuration_version__status="released",
        )
        self.assertIs(mock_dispatch_queryset.filter.return_value, result)

    @patch.object(EmailDispatch, "objects")
    @patch("tapir_mail.service.send_oldest_email_configuration.send_email")
    def test_sendEmailConfigurationDispatch_noValidRecipients_mailNotSent(
        self, mock_send_mail: Mock, mock_email_dispatch_queryset: Mock
    ):
        config_dispatch = EmailConfigurationDispatchFactory.build(recipients="  , \n")
        config_dispatch.save = Mock()

        SendOldestEmailConfiguration._send_email_configuration_dispatch(config_dispatch)

        mock_send_mail.assert_not_called()
        self.assertEqual(0, len(mock_email_dispatch_queryset.mock_calls))

        self.assertTrue(config_dispatch.is_sent)
        config_dispatch.save.assert_called_once()

    @patch.object(EmailDispatch, "objects")
    @patch("tapir_mail.service.send_oldest_email_configuration.send_email")
    def test_sendEmailConfigurationDispatch_hasValidRecipients_mailSentToValidRecipients(
        self, mock_send_mail: Mock, mock_email_dispatch_queryset: Mock
    ):
        config_dispatch = EmailConfigurationDispatchFactory.build(
            recipients=f"\n,{self.RECIPIENT_1},{self.RECIPIENT_2}",
            email_configuration_version__content=self.CONTENT,
            email_configuration_version__subject=self.SUBJECT,
            email_configuration_version__subtitle=self.SUBTITLE,
        )
        config_dispatch.save = Mock()
        mock_timezone_now(self, self.NOW)

        SendOldestEmailConfiguration._send_email_configuration_dispatch(config_dispatch)

        valid_recipients = [self.RECIPIENT_1, self.RECIPIENT_2]
        mock_send_mail.assert_called_once_with(
            mjml=self.CONTENT,
            subject=self.SUBJECT,
            subtitle=self.SUBTITLE,
            recipients=valid_recipients,
        )

        mock_email_dispatch_queryset.bulk_create.assert_called_once()
        bulk_create_args = mock_email_dispatch_queryset.bulk_create.call_args.args[0]
        for index, recipient in enumerate(valid_recipients):
            dispatch = bulk_create_args[index]
            self.assertEqual(recipient, dispatch.recipient)

        config_dispatch.is_sent = True
        config_dispatch.save.assert_called_once_with()

    def given_lock(self, can_lock: bool):
        patcher = patch("tapir_mail.service.send_oldest_email_configuration.cache.lock")
        self.mock_lock_builder = patcher.start()
        self.addCleanup(patcher.stop)
        self.mock_lock = Mock()
        self.mock_lock_builder.return_value = self.mock_lock
        self.mock_lock.acquire.return_value = can_lock

    def assert_lock_correctly_used(self):
        self.mock_lock_builder.assert_called_once_with(
            "send_oldest_email_configuration", timeout=1200
        )
        self.mock_lock.acquire.assert_called_once_with(blocking=False)
        self.mock_lock.release.assert_called_once()

    @patch.object(
        SendOldestEmailConfiguration,
        "_send_email_configuration_dispatch",
    )
    @patch.object(
        SendOldestEmailConfiguration,
        "_get_email_configuration_dispatches_that_should_be_sent",
    )
    def test_sendOldestEmailConfiguration_lockAlreadyInUse_doesNothing(
        self, mock_get_config: Mock, mock_send_email: Mock
    ):
        self.given_lock(can_lock=False)

        SendOldestEmailConfiguration.send_oldest_email_configuration()

        self.mock_lock_builder.assert_called_once_with(
            "send_oldest_email_configuration", timeout=1200
        )
        self.mock_lock.acquire.assert_called_once_with(blocking=False)
        mock_get_config.assert_not_called()
        mock_send_email.assert_not_called()

    @patch.object(
        SendOldestEmailConfiguration,
        "_get_email_configuration_dispatches_that_should_be_sent",
    )
    def test_sendOldestEmailConfiguration_exceptionThrown_lockReleased(
        self, mock_get_config: Mock
    ):
        self.given_lock(can_lock=True)
        mock_get_config.side_effect = Exception("Test")

        with self.assertRaises(Exception):
            SendOldestEmailConfiguration.send_oldest_email_configuration()

        self.assert_lock_correctly_used()

    @patch.object(
        SendOldestEmailConfiguration,
        "_send_email_configuration_dispatch",
    )
    @patch.object(
        SendOldestEmailConfiguration,
        "_get_email_configuration_dispatches_that_should_be_sent",
    )
    def test_sendOldestEmailConfiguration_noConfigToSend_noMailSent(
        self, mock_get_config: Mock, mock_send_email: Mock
    ):
        self.given_lock(can_lock=True)
        mock_get_config.return_value.order_by.return_value.first.return_value = None

        SendOldestEmailConfiguration.send_oldest_email_configuration()

        self.assert_lock_correctly_used()
        mock_get_config.return_value.order_by.assert_called_once_with("scheduled_time")
        mock_get_config.return_value.order_by.return_value.first.assert_called_once()
        mock_send_email.assert_not_called()

    @patch("tapir_mail.service.send_oldest_email_configuration.app")
    @patch.object(
        SendOldestEmailConfiguration,
        "_send_email_configuration_dispatch",
    )
    @patch.object(
        SendOldestEmailConfiguration,
        "_get_email_configuration_dispatches_that_should_be_sent",
    )
    def test_sendOldestEmailConfiguration_onlyOneConfigToSend_doesNotRepeatCeleryTask(
        self,
        mock_get_config: Mock,
        mock_send_email: Mock,
        mock_celery_app: Mock,
    ):
        self.given_lock(can_lock=True)
        mock_config = Mock()
        mock_get_config.return_value.order_by.return_value.first.return_value = (
            mock_config
        )
        mock_get_config.return_value.exists.return_value = False

        SendOldestEmailConfiguration.send_oldest_email_configuration()

        self.assert_lock_correctly_used()
        mock_get_config.return_value.order_by.assert_called_once_with("scheduled_time")
        mock_get_config.return_value.order_by.return_value.first.assert_called_once()
        mock_send_email.assert_called_once_with(mock_config)
        mock_celery_app.send_task.assert_not_called()

    @patch("tapir_mail.service.send_oldest_email_configuration.app")
    @patch.object(
        SendOldestEmailConfiguration,
        "_send_email_configuration_dispatch",
    )
    @patch.object(
        SendOldestEmailConfiguration,
        "_get_email_configuration_dispatches_that_should_be_sent",
    )
    def test_sendOldestEmailConfiguration_severalConfigToSend_sendsMailAndRepeatsCeleryTask(
        self,
        mock_get_config: Mock,
        mock_send_email: Mock,
        mock_celery_app: Mock,
    ):
        self.given_lock(can_lock=True)
        mock_config = Mock()
        mock_get_config.return_value.order_by.return_value.first.return_value = (
            mock_config
        )
        mock_config.return_value.exists.return_value = True

        SendOldestEmailConfiguration.send_oldest_email_configuration()

        self.assert_lock_correctly_used()
        mock_get_config.return_value.order_by.assert_called_once_with("scheduled_time")
        mock_get_config.return_value.order_by.return_value.first.assert_called_once()
        mock_send_email.assert_called_once_with(mock_config)
        mock_celery_app.send_task.assert_called_once_with(
            "tapir_mail.tasks.send_oldest_email_configuration_task"
        )
