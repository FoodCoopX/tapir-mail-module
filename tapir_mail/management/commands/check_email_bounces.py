import email
import imaplib
import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from tapir_mail.models import EmailDispatch
from tapir_mail.service.email import HEADER_NAME_EMAIL_TRACKING_ID
from tapir_mail_server import settings

LOG = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Reads unread emails from the given server and checks if they are bounces"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        mail = imaplib.IMAP4_SSL(settings.EMAIL_HOST, port=settings.EMAIL_PORT_IMAP)
        mail.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        mail.select(readonly=settings.DEBUG)

        (return_code, messages_id_blocks) = mail.search(None, "(UNSEEN)")
        if return_code != "OK":
            raise Exception(
                f"Connection to imap server failed, return code : {return_code}"
            )

        for block in messages_id_blocks:
            for message_id in block.split():
                self.process_message(mail, message_id)

        mail.logout()

    @staticmethod
    def process_message(mail: imaplib.IMAP4, message_id: str):
        return_code, message_bytes = mail.fetch(message_id, "(RFC822)")
        if return_code != "OK":
            raise Exception(
                f"Failed to get message with id : {message_id}, return code : {return_code}"
            )

        message = email.message_from_bytes(message_bytes[0][1])
        dispatch_id = message.get(HEADER_NAME_EMAIL_TRACKING_ID, None)
        email_dispatch: EmailDispatch = EmailDispatch.objects.filter(
            id=message[HEADER_NAME_EMAIL_TRACKING_ID]
        ).first()

        message_id = message.get("Message-Id", None)
        if email_dispatch:
            email_dispatch.bounce_message = (
                f"Email could not be delivered, bounce message id : {message_id}"
            )
            email_dispatch.save()
        else:
            LOG.warning(
                f"Received bounce mail but could not find the corresponding dispatch. Dispatch id: {dispatch_id}, message id: {message_id}"
            )

        mail.store(message_id, "+FLAGS", "(SEEN)")
