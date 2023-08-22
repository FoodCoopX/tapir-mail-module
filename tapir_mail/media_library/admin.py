import django_drf_filepond.models
from django.contrib import admin

# Register your models here.
admin.site.register(django_drf_filepond.models.StoredUpload)
admin.site.register(django_drf_filepond.models.TemporaryUpload)
admin.site.register(django_drf_filepond.models.TemporaryUploadChunked)
