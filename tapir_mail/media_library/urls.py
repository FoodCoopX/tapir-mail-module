from django.conf.urls import url
from django.urls import include, path
from rest_framework import routers

from tapir_mail.media_library import views

urlpatterns = [
    url(r"^filepond/", include("django_drf_filepond.urls")),
    url(r"^confirm_upload/$", views.ConfirmUploadView.as_view(), name="confirm_upload"),
    path("get_file/<str:upload_id>", views.get_file_view, name="get_file"),
]

router = routers.DefaultRouter()
router.register("temporary_upload", views.TemporaryUploadViewSet)
router.register("stored_upload", views.StoredUploadViewSet)

urlpatterns += router.urls
