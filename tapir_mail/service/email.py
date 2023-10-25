from bs4 import BeautifulSoup
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template import Context, Template


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

    if "tracking_url" in kwargs:
        email_body = _add_tracking_pixel(email_body, kwargs.pop("tracking_url"))

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


def _add_tracking_pixel(html_content, pixel_url):
    soup = BeautifulSoup(html_content, "html.parser")
    body = soup.find("body")
    img_tag = soup.new_tag("img", src=pixel_url, style="display:none")
    body.append(img_tag)
    return str(soup)
