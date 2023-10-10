from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.views.generic.base import TemplateView
from rest_framework import routers

from tapir_mail import views
from tapir_mail_server import settings

router = routers.DefaultRouter()
router.register("email_template", views.EmailTemplateViewSet)
router.register("email_configuration", views.EmailConfigurationViewSet)
router.register("email_configuration_version", views.EmailConfigurationVersionViewSet)
router.register("email_configuration_dispatch", views.EmailConfigurationDispatchViewSet)
router.register("email_dispatch", views.EmailDispatchViewSet)
router.register("triggers", views.TriggerListView, basename="Triggers")
router.register(r"segment", views.SegmentAndFilterViewSet, basename="segment")

urlpatterns = [
    re_path(
        r"^(?!(api)/).*$",
        TemplateView.as_view(template_name="index.html"),
    ),  # React index.html
    path("api/media_library/", include("tapir_mail.media_library.urls")),
    path("api/", include(router.urls)),  # REST API
] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT  # React static files
)
