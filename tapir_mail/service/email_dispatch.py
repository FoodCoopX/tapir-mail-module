import logging

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from tapir_mail.models import EmailConfigurationDispatch, EmailDispatch, ReleaseStatus
from tapir_mail.service.email import send_email
from tapir_mail.service.token import replace_tokens
from tapir_mail.service.triggers import trigger_registry

LOG = logging.getLogger(__name__)


class ResolveAndCreateEmailDispatches:
    """
    This class is responsible for resolving the Segment data and creating EmailDispatches for EmailConfigurationDispatches that are due to be sent.
    """

    @classmethod
    def resolve_and_create(cls):
        lock = cache.lock("resolve_and_create_email_dispatches", timeout=1200)
        if not lock.acquire(blocking=False):
            return

        try:
            config_dispatches: EmailConfigurationDispatch = (
                cls._get_email_configuration_dispatches_that_should_be_sent().order_by(
                    "scheduled_time"
                )[:10]
            )
            if not config_dispatches:
                return

            for config_dispatch in config_dispatches:
                try:
                    cls._create_email_dispatches(config_dispatch)
                except Exception as e:
                    LOG.error(
                        f"Error while creating email dispatches for EmailConfigurationDispatch#{config_dispatch.id}: {e}"
                    )

        finally:
            lock.release()

    @staticmethod
    @transaction.atomic
    def _create_email_dispatches(config_dispatch: EmailConfigurationDispatch):
        if not config_dispatch.email_configuration_version.segment_data:
            raise ValueError(
                f"Segment data is required to send an email! EmailConfigurationDispatch#{config_dispatch.id}"
            )

        recipients = config_dispatch.get_recipient_list()
        if not recipients:
            raise ValueError(
                f"No recipients found for EmailConfigurationDispatch#{config_dispatch.id}!"
            )

        EmailDispatch.objects.bulk_create(
            [
                EmailDispatch(
                    email_configuration_dispatch=config_dispatch,
                    recipient=recipient.email,
                )
                for recipient in recipients
            ]
        )

        config_dispatch.is_sent = True
        config_dispatch.save()

    @staticmethod
    def _get_email_configuration_dispatches_that_should_be_sent():
        return EmailConfigurationDispatch.objects.filter(
            is_sent=False,
            scheduled_time__lte=timezone.now(),
            email_configuration_version__status=ReleaseStatus.RELEASED,
        )


class SendEmailBatch:
    """
    This class is responsible for sending a batch of EmailDispatches.
    """

    @classmethod
    def send_email_dispatches(cls, batch_size=None):
        lock = cache.lock("send_email_task_lock", timeout=1200)
        if not lock.acquire(blocking=False):
            return

        try:
            if not batch_size:
                batch_size = getattr(settings, "EMAIL_DISPATCH_BATCH_SIZE", 50)

            batch = EmailDispatch.objects.filter(sent_time=None).order_by("created_at")[
                :batch_size
            ]
            cls._send_batch(batch)
        finally:
            lock.release()

    @staticmethod
    def _send_batch(email_dispatches):
        for email_dispatch in email_dispatches:
            with transaction.atomic():
                config_dispatch = email_dispatch.email_configuration_dispatch
                recipient = email_dispatch.recipient
                mjml = replace_tokens(
                    config_dispatch.email_configuration_version.content, recipient
                )
                try:
                    send_email(
                        mjml=mjml,
                        subject=config_dispatch.email_configuration_version.subject,
                        subtitle=config_dispatch.email_configuration_version.subtitle,
                        recipients=[recipient],
                    )

                    if (
                        config_dispatch.email_configuration_version.trigger
                        in trigger_registry.keys()
                    ):
                        trigger_registry[
                            config_dispatch.email_configuration_version.trigger
                        ].after_mail_sent(config_dispatch)

                    email_dispatch.sent_time = timezone.now()
                    email_dispatch.save()

                except Exception as e:
                    LOG.error(f"Error while sending email to {recipient}: {e}")
                    # TODO: Error handling + retry logic
                    # 1. save error message in EmailDispatch
                    # 2. differentiate between different error types to decide if and when to retry
