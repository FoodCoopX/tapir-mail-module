from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

from tapir_mail.models import EmailConfiguration, EmailTemplate
from tapir_mail.serializers import (
    EmailConfigurationCreateSerializer,
    EmailConfigurationSerializer,
    EmailTemplateCreateSerializer,
    EmailTemplateSerializer,
)


@extend_schema_view(
    create=extend_schema(operation_id="emailtemplates_create"),
    list=extend_schema(operation_id="emailtemplates_list"),
    retrieve=extend_schema(operation_id="emailtemplates_retrieve"),
    update=extend_schema(operation_id="emailtemplates_update"),
    destroy=extend_schema(operation_id="emailtemplates_destroy"),
)
class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()

    def get_serializer_class(self):
        if self.action in ["create", "update"]:
            return EmailTemplateCreateSerializer
        return EmailTemplateSerializer


@extend_schema_view(
    create=extend_schema(operation_id="emailconfigurations_create"),
    list=extend_schema(operation_id="emailconfigurations_list"),
    retrieve=extend_schema(operation_id="emailconfigurations_retrieve"),
    update=extend_schema(operation_id="emailconfigurations_update"),
    destroy=extend_schema(operation_id="emailconfigurations_destroy"),
)
class EmailConfigurationViewSet(viewsets.ModelViewSet):
    queryset = EmailConfiguration.objects.all()

    def get_serializer_class(self):
        if self.action in ["create", "update"]:
            return EmailConfigurationCreateSerializer
        return EmailConfigurationSerializer
