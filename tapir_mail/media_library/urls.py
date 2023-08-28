from django.conf.urls import url
from django.urls import include
from rest_framework import routers

from tapir_mail.media_library import views

urlpatterns = [
    url(r"^filepond/", include("django_drf_filepond.urls")),
    url(r"^confirm_upload/$", views.ConfirmUploadView.as_view(), name="confirm_upload"),
]

router = routers.DefaultRouter()
router.register("temporary_upload", views.TemporaryUploadViewSet)
router.register("stored_upload", views.StoredUploadViewSet)

urlpatterns += router.urls
