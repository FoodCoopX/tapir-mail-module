from django.core.mail import EmailMultiAlternatives
from django.template import Template, Context

from tapir_mail_server import settings


def send_email(**kwargs):
    """
    Sends an email using the configuration provided in the kwargs.
    """

    mjml = kwargs.pop("mjml")
    if not mjml:
        raise ValueError("mjml is required")

    email_body = Template(
        "{% load mjml %}\n{% mjml %}" + mjml + "{% endmjml %}"
    ).render(Context({}))

    subject = kwargs.pop("subject")
    recipients = kwargs.pop("recipients")

    # TODO: persist sent email in database

    email = EmailMultiAlternatives(
        subject=subject,
        body=email_body,
        to=recipients,
        bcc=[settings.EMAIL_AUTO_BCC]
        if hasattr(settings, "EMAIL_AUTO_BCC") and settings.EMAIL_AUTO_BCC
        else None,
        from_email=settings.EMAIL_HOST_SENDER,
        headers={
            "From": f"{settings.EMAIL_HOST_SENDER_NAME} <{settings.EMAIL_HOST_SENDER}>"
        }
        if hasattr(settings, "EMAIL_HOST_SENDER_NAME")
        else None,
    )
    email.content_subtype = "html"
    email.send()
