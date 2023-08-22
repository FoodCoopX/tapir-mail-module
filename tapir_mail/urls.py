from django.conf.urls.static import static
from django.urls import path, include
from django.urls import path, re_path
from django.views.generic.base import TemplateView

from tapir_mail.views import (
    list_email_templates,
    read_email_template,
    save_email_template,
    save_mailing,
)
from tapir_mail_server import settings

urlpatterns = [
    path("api/demo/templates/save", save_email_template, name="save_email_template"),
    path("api/demo/templates/list", list_email_templates, name="list_email_templates"),
    path(
        "api/demo/templates/read/<str:name>",
        read_email_template,
        name="read_email_template",
    ),
    path("media_library/", include("tapir_mail.media_library.urls")),
    path(
        "api/demo/mailing/save",
        save_mailing,
        name="save_mailing",
    ),
    re_path(
        r"^.*$", TemplateView.as_view(template_name="index.html")
    ),  # React index.html
] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT
)  # React static files
