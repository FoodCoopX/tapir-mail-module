from celery import shared_task
from django.core.cache import cache
from django.utils import timezone

from tapir_mail.models import EmailConfigurationDispatch, EmailDispatch
from tapir_mail.service.email import send_email
from tapir_mail_server.celery import app


@shared_task
def send_oldest_email_configuration_task():
    print("START TASK")
    lock = cache.lock("dummy", timeout=600)
    if not lock.acquire(blocking=False):
        print("WAS LOCKED")
        return

    try:
        config_dispatch: EmailConfigurationDispatch = (
            EmailConfigurationDispatch.objects.filter(is_sent=False)
            .order_by("scheduled_time")
            .first()
        )
        if not config_dispatch:
            print("NO UNSENT CONFIG")
            return

        send_email_configuration_dispatch(config_dispatch)

        if EmailConfigurationDispatch.objects.filter(is_sent=False).exists():
            print("QUICK TASK SEND")
            app.send_task("tapir_mail.tasks.send_oldest_email_configuration_task")
    finally:
        lock.release()


def send_email_configuration_dispatch(config_dispatch: EmailConfigurationDispatch):
    print(
        f"SENDING {config_dispatch.email_configuration_version.email_configuration.name}"
    )
    recipients = [
        email.strip()
        for email in config_dispatch.recipients.split(",")
        if email.strip()
    ]

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
