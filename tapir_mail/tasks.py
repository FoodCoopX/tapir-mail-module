from celery import shared_task

from tapir_mail.service.send_oldest_email_configuration import (
    SendOldestEmailConfiguration,
)


@shared_task
def send_oldest_email_configuration_task():
    SendOldestEmailConfiguration.send_oldest_email_configuration()
