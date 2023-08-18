from django_drf_filepond.models import TemporaryUpload, StoredUpload
from rest_framework import serializers


class TemporaryUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemporaryUpload
        fields = "__all__"


class StoredUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoredUpload
        fields = "__all__"
