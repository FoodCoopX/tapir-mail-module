import logging

from django.conf import settings
from django.core.cache import cache
from django.core.mail import get_connection
from django.db import transaction
from django.utils import timezone

from tapir_mail.models import EmailConfigurationDispatch, EmailDispatch, ReleaseStatus
from tapir_mail.service.email import prepare_email
from tapir_mail.service.token import replace_tokens
from tapir_mail.service.tracking import get_tracking_url
from tapir_mail.service.triggers import trigger_registry

LOG = logging.getLogger(__name__)


class ResolveAndCreateEmailDispatches:
    """
    This class is responsible for resolving the Segment data and creating EmailDispatches for EmailConfigurationDispatches that are due to be sent.
    """

    @classmethod
    def resolve_and_create(cls):
        lock = cache.lock("resolve_and_create_email_dispatches", timeout=180)
        if not lock.acquire(blocking=False):
            LOG.error(
                "Could not acquire lock for resolve_and_create_email_dispatches lock"
            )
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
        lock = cache.lock("send_email_task_lock", timeout=180)
        if not lock.acquire(blocking=False):
            LOG.error("Could not acquire lock for send_email_task_lock")
            return

        try:
            if not batch_size:
                batch_size = getattr(settings, "EMAIL_DISPATCH_BATCH_SIZE", 50)

            batch = (
                EmailDispatch.objects.filter(sent_time=None)
                .order_by("created_at")
                .prefetch_related("email_configuration_dispatch")
                .prefetch_related(
                    "email_configuration_dispatch__email_configuration_version"
                )[:batch_size]
            )

            cls._send_batch(batch)
        finally:
            lock.release()

    @classmethod
    def _send_batch(cls, email_dispatches):
        if not email_dispatches:
            LOG.warning("Nothing to do in send_batch")
            return

        emails = cls._prepare_emails(email_dispatches)

        if not emails:
            LOG.warning(
                f"No emails to send in batch for EmailConfigurationDispatch#{email_dispatches[0].email_configuration_dispatch.id}"
            )
            return

        try:
            with get_connection() as connection:
                connection.send_messages([e[0] for e in emails])
        except Exception as e:
            LOG.error(f"Error while sending batch emails: {e}")
            with transaction.atomic():
                for _, email_dispatch in emails:
                    email_dispatch.error_message = str(e)
                    email_dispatch.save()
            raise

        LOG.info(f"Sent {len(emails)} emails in this batch")

        cls._post_send(emails)

    @classmethod
    def _prepare_emails(cls, email_dispatches):
        emails = []
        for email_dispatch in email_dispatches:
            config_dispatch = email_dispatch.email_configuration_dispatch
            recipient = email_dispatch.recipient
            mjml = replace_tokens(
                config_dispatch.email_configuration_version.content, recipient
            )
            try:
                email = prepare_email(
                    mjml=mjml,
                    subject=config_dispatch.email_configuration_version.subject,
                    recipients=[recipient],
                    tracking_url=get_tracking_url(email_dispatch),
                )
                emails.append((email, email_dispatch))
            except Exception as e:
                LOG.error(f"Error while preparing email to {recipient}: {e}")
                with transaction.atomic():
                    email_dispatch.error_message = str(e)
                    email_dispatch.save()

        return emails

    @classmethod
    def _post_send(cls, emails):
        for email, email_dispatch in emails:
            try:
                with transaction.atomic():
                    trigger_class = trigger_registry.get(
                        email_dispatch.email_configuration_dispatch.email_configuration_version.trigger,
                        None,
                    )
                    if trigger_class:
                        trigger_class.after_mail_sent(email_dispatch)

                    email_dispatch.sent_time = timezone.now()
                    email_dispatch.save()
            except Exception as e:
                LOG.error(
                    f"Error after sending email to {email_dispatch.recipient}: {e}"
                )
                with transaction.atomic():
                    email_dispatch.error_message = str(e)
                    email_dispatch.save()
