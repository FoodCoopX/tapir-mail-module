from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.views.generic.base import TemplateView
from rest_framework import routers

from tapir_mail import views

router = routers.DefaultRouter()
router.register("email_template", views.EmailTemplateViewSet, basename="email_template")
router.register(
    "email_template_paginated",
    views.PaginatedEmailTemplateViewSet,
    basename="email_template_paginated",
)
router.register("email_configuration", views.EmailConfigurationViewSet)
router.register("email_configuration_version", views.EmailConfigurationVersionViewSet)
router.register("email_configuration_dispatch", views.EmailConfigurationDispatchViewSet)
router.register("email_dispatch", views.EmailDispatchViewSet)
router.register("triggers", views.TriggerListView, basename="Triggers")
router.register(
    "trigger_tokens", views.TransactionalTriggerTokenView, basename="Trigger Tokens"
)
router.register("segment", views.SegmentAndFilterViewSet, basename="segment")
router.register("tokens", views.TokensView, basename="tokens")
router.register("tracking", views.TrackingView, basename="tracking")
router.register("static_segment", views.StaticSegmentViewSet)
router.register("static_segment_recipient", views.StaticSegmentRecipientViewSet)

urlpatterns = [
    path("api/media_library/", include("tapir_mail.media_library.urls")),
    path("api/", include(router.urls)),  # REST API
    re_path(
        r"^(?!(api|config\.js|static)/).*$",
        TemplateView.as_view(template_name="index.html"),
    ),  # React index.html
    path(
        "api/missing_triggers",
        views.MissingTriggersView.as_view(),
        name="missing_triggers",
    ),
] + static(
    settings.STATIC_URL, document_root=settings.STATIC_ROOT  # React static files
)
