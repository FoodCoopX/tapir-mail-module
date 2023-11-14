from bs4 import BeautifulSoup
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template import Context, Template

HEADER_NAME_EMAIL_TRACKING_ID = "tapir-tracking-id"


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
        email_body = _add_tracking_pixel(email_body, tracking_url)

    headers = {HEADER_NAME_EMAIL_TRACKING_ID: tracking_id}
    if hasattr(settings, "EMAIL_HOST_SENDER_NAME"):
        headers[
            "From"
        ] = f"{settings.EMAIL_HOST_SENDER_NAME} <{settings.EMAIL_HOST_SENDER}>"

    email = EmailMultiAlternatives(
        subject=subject,
        body=email_body,
        to=recipients if isinstance(recipients, list) else [recipients],
        bcc=[getattr(settings, "EMAIL_AUTO_BCC", None)],
        from_email=settings.EMAIL_HOST_SENDER,
        headers=headers,
    )
    email.content_subtype = "html"

    return email


def _add_tracking_pixel(html_content, pixel_url):
    soup = BeautifulSoup(html_content, "html.parser")
    body = soup.find("body")
    img_tag = soup.new_tag("img", src=pixel_url, style="display:none")
    body.append(img_tag)
    return str(soup)
