from django.urls import path
from django.views.generic.base import TemplateView
from django.conf.urls.static import static

from tapir_mail_server import settings

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html"))  # React index.html
] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT
)  # React static files
