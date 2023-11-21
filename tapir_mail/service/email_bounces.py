import email
import logging
from email.message import Message
from imaplib import IMAP4_SSL, IMAP4

from flufl.bounce import all_failures

from tapir_mail.models import EmailDispatch
from tapir_mail.service.email import _get_dispatch_id_from_email_return_path
from tapir_mail_server import settings

LOG = logging.getLogger(__name__)


class EmailBounces:
    @classmethod
    def check_for_bounces(cls):
        mail_client = IMAP4_SSL(settings.EMAIL_HOST, port=settings.EMAIL_PORT_IMAP)
        (return_code, _) = mail_client.login(
            settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD
        )
        if return_code != "OK":
            raise Exception(f"Imap server login failed, return code : {return_code}")

        try:
            mail_client.select(readonly=settings.DEBUG)

            (return_code, messages_id_blocks) = mail_client.search(None, "(UNSEEN)")
            if return_code != "OK":
                raise Exception(
                    f"Imap server search failed, return code : {return_code}"
                )

            for block in messages_id_blocks:
                for message_id in block.split():
                    cls.process_message(mail_client, message_id)
        finally:
            mail_client.logout()

    @classmethod
    def process_message(cls, mail_client: IMAP4, message_id: str):
        return_code, message_bytes = mail_client.fetch(message_id, "(RFC822)")
        if return_code != "OK":
            raise Exception(
                f"Failed to get message with id : {message_id}, return code : {return_code}"
            )

        message = email.message_from_bytes(message_bytes[0][1])

        return_path = message.get("Return-Path", None)
        dispatch_id = _get_dispatch_id_from_email_return_path(return_path)
        if not dispatch_id:
            # this email is not a bounce
            return

        email_dispatch: EmailDispatch = EmailDispatch.objects.filter(
            id=dispatch_id
        ).first()
        message_uid = message.get("Message-Id", None)
        if email_dispatch:
            email_dispatch.bounce_message = (
                f"Email could not be delivered, bounce message id : {message_uid}"
            )
            email_dispatch.bounce_type = cls.determine_bounce_type(
                message, email_dispatch.recipient
            )
            email_dispatch.save()
        else:
            LOG.warning(
                f"Received bounce mail but could not find the corresponding dispatch. "
                f"Dispatch id: {dispatch_id}, message id: {message_uid}"
            )

        mail_client.store(message_id, "+FLAGS", "(SEEN)")

    @staticmethod
    def determine_bounce_type(message: Message, recipient_address: str):
        soft, hard = all_failures(message)
        if recipient_address in hard:
            return EmailDispatch.BounceTypes.HARD
        if recipient_address in soft:
            return EmailDispatch.BounceTypes.SOFT
        return EmailDispatch.BounceTypes.UNKNOWN
