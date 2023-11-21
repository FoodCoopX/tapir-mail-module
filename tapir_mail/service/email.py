from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template import Context, Template

from tapir_mail.service.tracking import add_tracking_pixel


def prepare_email(
    mjml: str = None,
    subject: str = None,
    recipients=None,
    tracking_url: str = None,
    tracking_id: str = None,
):
    """
    Sends an email using the configuration provided in the kwargs.
    """

    if recipients is None:
        recipients = []

    if not mjml:
        raise ValueError("mjml is required")

    if not recipients:
        raise ValueError("recipients is required")

    email_body = Template(
        "{% load mjml %}\n{% mjml %}" + mjml + "{% endmjml %}"
    ).render(Context({}))

    if tracking_url:
        email_body = add_tracking_pixel(email_body, tracking_url)

    email = EmailMultiAlternatives(
        subject=subject,
        body=email_body,
        to=recipients if isinstance(recipients, list) else [recipients],
        bcc=[getattr(settings, "EMAIL_AUTO_BCC", None)],
        from_email=_build_from_email(settings.EMAIL_BOUNCE_ADDRESS, tracking_id),
        headers={
            "From": f"{settings.EMAIL_HOST_SENDER_NAME} <{settings.EMAIL_HOST_SENDER}>",
        },
    )
    email.content_subtype = "html"

    return email


def _build_from_email(email_host_sender: str, tracking_id: str):
    prefix, suffix = email_host_sender.split("@")
    return f"{prefix}+{tracking_id}@{suffix}"


def _get_dispatch_id_from_email_return_path(email_from: str):
    if not email_from or "@" not in email_from:
        return None
    prefix, _ = email_from.split("@")
    if "+" not in prefix:
        return None
    _, dispatch_id = prefix.split("+")
    return dispatch_id
