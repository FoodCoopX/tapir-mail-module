from django.core.mail import EmailMultiAlternatives
from django.template import Context, Template
from django.conf import settings

def send_email(**kwargs):
    """
    Sends an email using the configuration provided in the kwargs.
    """

    mjml = kwargs.pop("mjml")
    if not mjml:
        raise ValueError("mjml is required")

    recipients = kwargs.pop("recipients", None)
    if not recipients:
        raise ValueError("recipients is required")

    email_body = Template(
        "{% load mjml %}\n{% mjml %}" + mjml + "{% endmjml %}"
    ).render(Context({}))

    subject = kwargs.pop("subject")

    email = EmailMultiAlternatives(
        subject=subject,
        body=email_body,
        to=recipients,
        bcc=[getattr(settings, "EMAIL_AUTO_BCC", None)],
        from_email=settings.EMAIL_HOST_SENDER,
        headers={
            "From": f"{settings.EMAIL_HOST_SENDER_NAME} <{settings.EMAIL_HOST_SENDER}>"
        }
        if hasattr(settings, "EMAIL_HOST_SENDER_NAME")
        else None,
    )
    email.content_subtype = "html"
    email.send()
