import email
import logging
from email.message import Message
from imaplib import IMAP4_SSL, IMAP4

from django.conf import settings
from django.utils import timezone
from flufl.bounce import all_failures

from tapir_mail.models import EmailDispatch
from tapir_mail.service.email import _get_dispatch_id_from_email_return_path

LOG = logging.getLogger(__name__)


class EmailBounces:
    @classmethod
    def check_for_bounces(cls):
        mail_client = IMAP4_SSL(settings.EMAIL_HOST, port=settings.EMAIL_PORT_IMAP)
        return_code, _ = mail_client.login(
            settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD
        )
        if return_code != "OK":
            raise Exception(f"Imap server login failed, return code : {return_code}")

        try:
            mail_client.select(readonly=settings.DEBUG)

            return_code, messages_id_blocks = mail_client.search(None, "(UNSEEN)")
            if return_code != "OK":
                raise Exception(
                    f"Imap server search failed, return code : {return_code}"
                )
            if not messages_id_blocks:
                LOG.info("Nothing to check for in EmailBounces.check_for_bounces")
                return

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

        dispatch_id = cls.get_return_path_from_headers(
            message,
            [
                "Return-Path",
                "X-Original-To",
                "Delivered-To",
                "To",
            ],
        )
        if not dispatch_id:
            dispatch_id = cls._get_envid_from_dsn(message)

        if not dispatch_id:
            LOG.debug(f"Email is not a bounce : {message.as_string()}")
            return

        email_dispatch: EmailDispatch = EmailDispatch.objects.filter(
            id=dispatch_id
        ).first()
        message_uid = message.get("Message-Id", None)
        if not email_dispatch:
            LOG.warning(
                f"Received bounce mail but could not find the corresponding dispatch. "
                f"Dispatch id: {dispatch_id}, message id: {message_uid}"
            )
            mail_client.store(message_id, "+FLAGS", "(SEEN)")
            return

        cls.save_and_log_dsn_message(
            message=message,
            email_dispatch=email_dispatch,
            dispatch_id=dispatch_id,
            message_uid=message_uid,
        )

        mail_client.store(message_id, "+FLAGS", "(SEEN)")

    @classmethod
    def save_and_log_dsn_message(
        cls,
        message: Message,
        email_dispatch: EmailDispatch,
        dispatch_id: str,
        message_uid: str,
    ):
        dsn_action = cls._get_dsn_action(message)

        if dsn_action in ("delivered", "relayed", "expanded"):
            email_dispatch.dsn_delivered_time = timezone.now()
            email_dispatch.save()
        elif dsn_action == "delayed":
            LOG.info(
                f"DSN delay notification for dispatch {dispatch_id}, message id: {message_uid}"
            )
        else:
            email_dispatch.bounce_message = f"Email could not be delivered, bounce message id : {message_uid}, dsn_action: {dsn_action}"
            email_dispatch.bounce_type = cls.determine_bounce_type(
                message, email_dispatch.recipient
            )
            email_dispatch.save()

    @staticmethod
    def _get_dsn_action(message: Message):
        content_type = message.get_content_type()
        if content_type != "multipart/report":
            return None

        for part in message.walk():
            if part.get_content_type() != "message/delivery-status":
                continue
            payload = part.get_payload()
            if isinstance(payload, list):
                for dsn_part in payload:
                    action = dsn_part.get("Action", None)
                    if action:
                        return action.strip().lower()
            elif isinstance(payload, str):
                for line in payload.splitlines():
                    if line.lower().startswith("action:"):
                        return line.split(":", 1)[1].strip().lower()

        return None

    @staticmethod
    def _get_envid_from_dsn(message: Message):
        content_type = message.get_content_type()
        if content_type != "multipart/report":
            return None

        for part in message.walk():
            if part.get_content_type() == "message/delivery-status":
                payload = part.get_payload()
                if isinstance(payload, list):
                    for dsn_part in payload:
                        envid = dsn_part.get("Original-Envelope-Id", None)
                        if envid:
                            return envid.strip()
                elif isinstance(payload, str):
                    for line in payload.splitlines():
                        if line.lower().startswith("original-envelope-id:"):
                            return line.split(":", 1)[1].strip()
        return None

    @staticmethod
    def get_return_path_from_headers(message: Message, headers: list[str]):
        for header in headers:
            dispatch_id = _get_dispatch_id_from_email_return_path(
                message.get(header, None)
            )
            if dispatch_id:
                return dispatch_id

        return None

    @staticmethod
    def determine_bounce_type(message: Message, recipient_address: str):
        soft, hard = all_failures(message)
        if recipient_address in hard:
            return EmailDispatch.BounceTypes.HARD
        if recipient_address in soft:
            return EmailDispatch.BounceTypes.SOFT
        return EmailDispatch.BounceTypes.UNKNOWN
