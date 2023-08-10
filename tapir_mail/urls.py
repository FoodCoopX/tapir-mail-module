from django.conf.urls.static import static
from django.urls import path
from django.views.generic.base import TemplateView

from tapir_mail.views import (
    list_email_templates,
    read_email_template,
    save_email_template,
)
from tapir_mail_server import settings

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html")),  # React index.html
    path("api/demo/templates/save", save_email_template, name="save_email_template"),
    path("api/demo/templates/list", list_email_templates, name="list_email_templates"),
    path(
        "api/demo/templates/read/<str:name>",
        read_email_template,
        name="read_email_template",
    ),
] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT
)  # React static files
