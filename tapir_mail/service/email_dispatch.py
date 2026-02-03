import logging

from django.conf import settings
from django.core.cache import cache as redis_cache
from django.core.mail import get_connection
from django.db import transaction
from django.utils import timezone

from tapir_mail.models import EmailConfigurationDispatch, EmailDispatch, ReleaseStatus
from tapir_mail.service.email import prepare_email
from tapir_mail.service.recipient_list_provider import (
    RecipientListProvider,
)
from tapir_mail.service.token import (
    find_tokens,
    replace_tokens,
    resolve_recipient_tokens,
    TOKEN_TYPE_RECIPIENT,
    TOKEN_TYPE_DYNAMIC,
    resolve_dynamic_tokens,
)
from tapir_mail.service.tracking import get_tracking_url
from tapir_mail.service.triggers import trigger_registry

LOG = logging.getLogger(__name__)


class ResolveAndCreateEmailDispatches:
    """
    This class is responsible for resolving the Segment data and creating EmailDispatches for EmailConfigurationDispatches that are due to be sent.
    """

    MAX_RETRIES = 10

    @classmethod
    def resolve_and_create(cls):
        lock = redis_cache.lock(
            "resolve_and_create_email_dispatches", timeout=60 * 3
        )  # 3 minutes
        if not lock.acquire(blocking=False):
            LOG.error(
                "Could not acquire lock for resolve_and_create_email_dispatches lock"
            )
            return

        try:
            config_dispatches = (
                cls._get_email_configuration_dispatches_that_should_be_sent().order_by(
                    "scheduled_time"
                )[:10]
            )
            if not config_dispatches:
                return

            for config_dispatch in config_dispatches:
                cache_key = f"dispatch_retry_count_{config_dispatch.id}"
                try:
                    cls._create_email_dispatches(config_dispatch)
                    redis_cache.delete(cache_key)
                except Exception as e:
                    retry_count = redis_cache.get(cache_key, 0) + 1
                    redis_cache.set(
                        cache_key, retry_count, timeout=60 * 30
                    )  # 30 minutes

                    if retry_count > cls.MAX_RETRIES:
                        LOG.error(
                            f"Retried {cls.MAX_RETRIES} times. Giving up and setting EmailConfigurationVersion#{config_dispatch.email_configuration_version.id} to ERROR."
                        )
                        config_dispatch.email_configuration_version.status = (
                            ReleaseStatus.ERROR
                        )
                        config_dispatch.email_configuration_version.save()
                        redis_cache.delete(cache_key)
                    else:
                        LOG.error(
                            f"Error while creating email dispatches for EmailConfigurationDispatch#{config_dispatch.id}. Retrying... Error: {e}"
                        )

        finally:
            lock.release()

    @classmethod
    @transaction.atomic
    def _create_email_dispatches(cls, config_dispatch: EmailConfigurationDispatch):
        recipients = (
            RecipientListProvider.get_recipient_list_from_email_configuration_dispatch(
                config_dispatch
            )
        )
        if not recipients:
            raise ValueError(
                f"No recipients found for EmailConfigurationDispatch#{config_dispatch.id}!"
            )

        recipient_tokens = find_tokens(
            config_dispatch.email_configuration_version.content,
            token_type=TOKEN_TYPE_RECIPIENT,
        )

        dynamic_tokens = find_tokens(
            config_dispatch.email_configuration_version.content,
            token_type=TOKEN_TYPE_DYNAMIC,
        )
        cache = {}

        dispatches = []
        for recipient in recipients:
            dispatches.extend(
                cls._build_email_dispatches_for_recipient(
                    config_dispatch=config_dispatch,
                    recipient=recipient,
                    recipient_tokens=recipient_tokens,
                    dynamic_tokens=dynamic_tokens,
                    cache=cache,
                )
            )

        EmailDispatch.objects.bulk_create(dispatches)

        config_dispatch.is_sent = True
        config_dispatch.save()

    @classmethod
    def _build_email_dispatches_for_recipient(
        cls,
        config_dispatch: EmailConfigurationDispatch,
        recipient,
        recipient_tokens,
        dynamic_tokens,
        cache: dict,
    ):
        dispatches = [
            cls._build_email_dispatch(
                config_dispatch=config_dispatch,
                recipient=recipient,
                recipient_tokens=recipient_tokens,
                dynamic_tokens=dynamic_tokens,
                cache=cache,
                email=recipient.email,
            )
        ]

        get_extra_recipient_addresses = getattr(
            recipient, "get_extra_recipient_addresses", None
        )
        extra_addresses = (
            []
            if get_extra_recipient_addresses is None
            else get_extra_recipient_addresses()
        )

        for extra_address in extra_addresses:
            dispatches.append(
                cls._build_email_dispatch(
                    config_dispatch=config_dispatch,
                    recipient=recipient,
                    recipient_tokens=recipient_tokens,
                    dynamic_tokens=dynamic_tokens,
                    cache=cache,
                    email=extra_address,
                )
            )

        return dispatches

    @staticmethod
    def _build_email_dispatch(
        config_dispatch: EmailConfigurationDispatch,
        recipient,
        recipient_tokens,
        dynamic_tokens,
        cache: dict,
        email: str,
    ):
        return EmailDispatch(
            email_configuration_dispatch=config_dispatch,
            recipient=email,
            recipient_tokens=resolve_recipient_tokens(recipient_tokens, recipient)
            | resolve_dynamic_tokens(
                dynamic_tokens,
                recipient,
                cache,
            ),
            additional_tokens=config_dispatch.additional_tokens,
            created_at=config_dispatch.scheduled_time,
        )

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
        lock = redis_cache.lock("send_email_task_lock", timeout=1800)
        if not lock.acquire(blocking=False):
            LOG.error("Could not acquire lock for send_email_task_lock")
            return

        try:
            if not batch_size:
                batch_size = getattr(settings, "EMAIL_DISPATCH_BATCH_SIZE", 50)

            batch = (
                EmailDispatch.objects.filter(sent_time=None)
                .exclude(
                    email_configuration_dispatch__email_configuration_version__status=ReleaseStatus.ERROR
                )
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

            try:
                mjml = replace_tokens(
                    config_dispatch.email_configuration_version.content,
                    email_dispatch.recipient_tokens,
                    email_dispatch.additional_tokens,
                )

                email = prepare_email(
                    mjml=mjml,
                    subject=config_dispatch.email_configuration_version.subject,
                    recipients=[email_dispatch.recipient],
                    tracking_url=get_tracking_url(email_dispatch),
                    tracking_id=email_dispatch.id,
                )
                emails.append((email, email_dispatch))
            except Exception as e:
                LOG.error(
                    f"Error while preparing email to {email_dispatch.recipient}: {e}"
                )
                with transaction.atomic():
                    email_dispatch.error_message = str(e)
                    email_dispatch.save()

        return emails

    @classmethod
    def _post_send(cls, emails):
        for email, email_dispatch in emails:
            try:
                with transaction.atomic():
                    for trigger_data in (
                        email_dispatch.email_configuration_dispatch.email_configuration_version.triggers
                        or []
                    ):
                        trigger_class = trigger_registry.get(
                            trigger_data["trigger_id"],
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


class RetryEmailDispatch:
    @classmethod
    def _copy_email_dispatch(cls, email_dispatch: EmailDispatch):
        return EmailDispatch(
            email_configuration_dispatch=email_dispatch.email_configuration_dispatch,
            recipient=email_dispatch.recipient,
            recipient_tokens=email_dispatch.recipient_tokens,
        )

    @classmethod
    @transaction.atomic
    def retry(cls, email_dispatch: EmailDispatch):
        most_recent_dispatch = email_dispatch
        while most_recent_dispatch.next_retry is not None:
            most_recent_dispatch = most_recent_dispatch.next_retry

        if (
            most_recent_dispatch.error_message is None
            and most_recent_dispatch.bounce_message is None
        ):
            raise ValueError(
                f"EmailDispatch#{email_dispatch.id} is not in an error state. Cannot retry."
                if most_recent_dispatch.id == email_dispatch.id
                else f"EmailDispatch#{email_dispatch.id} already has a pending retry: EmailDispatch#{most_recent_dispatch.id}"
            )

        LOG.info(f"Retrying EmailDispatch#{most_recent_dispatch.id}")

        retry_dispatch = cls._copy_email_dispatch(most_recent_dispatch)
        retry_dispatch.save()

        most_recent_dispatch.next_retry = retry_dispatch
        most_recent_dispatch.save()

        return retry_dispatch

    @classmethod
    @transaction.atomic
    def retry_all_failed(cls, email_configuration_dispatch: EmailConfigurationDispatch):
        failed_dispatches = email_configuration_dispatch.emaildispatch_set.filter(
            next_retry__isnull=True,  # Select only the most recent dispatches in each chain
        ).with_error(True)
        for email_dispatch in failed_dispatches:
            cls.retry(email_dispatch)

        LOG.info(
            f"Retried failed EmailDispatches for EmailConfigurationDispatch#{email_configuration_dispatch.id}"
        )

        return failed_dispatches.count()
