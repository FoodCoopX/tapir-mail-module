from django.conf.urls.static import static
from django.urls import path
from django.views.generic.base import TemplateView

from tapir_mail.views import log_email_html
from tapir_mail_server import settings

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html")),  # React index.html
    path("api/demo/log_email_html", log_email_html, name="log_email_html"),
] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT
)  # React static files
