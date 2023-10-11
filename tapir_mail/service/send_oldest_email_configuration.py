from django.core.cache import cache
from django.utils import timezone

from tapir_mail.models import EmailConfigurationDispatch, EmailDispatch, ReleaseStatus
from tapir_mail.service.email import send_email
from tapir_mail_server.celery import app


class SendOldestEmailConfiguration:
    @classmethod
    def send_oldest_email_configuration(cls):
        lock = cache.lock("send_oldest_email_configuration", timeout=1200)
        if not lock.acquire(blocking=False):
            return

        try:
            config_dispatch: EmailConfigurationDispatch = (
                cls._get_email_configuration_dispatches_that_should_be_sent()
                .order_by("scheduled_time")
                .first()
            )
            if not config_dispatch:
                return

            cls._send_email_configuration_dispatch(config_dispatch)

            if cls._get_email_configuration_dispatches_that_should_be_sent().exists():
                app.send_task("tapir_mail.tasks.send_oldest_email_configuration_task")
        finally:
            lock.release()

    @staticmethod
    def _send_email_configuration_dispatch(config_dispatch: EmailConfigurationDispatch):
        if not config_dispatch.email_configuration_version.segment_data:
            raise ValueError("Segment data is required to send an email!")

        recipients = config_dispatch.get_recipient_list()

        if recipients:
            send_email(
                mjml=config_dispatch.email_configuration_version.content,
                subject=config_dispatch.email_configuration_version.subject,
                subtitle=config_dispatch.email_configuration_version.subtitle,
                recipients=recipients,
            )

            EmailDispatch.objects.bulk_create(
                [
                    EmailDispatch(
                        email_configuration_dispatch=config_dispatch,
                        recipient=recipient,
                        sent_time=timezone.now(),
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
