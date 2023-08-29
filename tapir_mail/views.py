from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from tapir_mail.models import EmailConfiguration, EmailTemplate
from tapir_mail.serializers import (
    EmailConfigurationCreateSerializer,
    EmailConfigurationSerializer,
    EmailTemplateCreateSerializer,
    EmailTemplateSerializer,
)
from tapir_mail.service.email import send_email


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
    send_email=extend_schema(
        operation_id="emailconfigurations_send_email", request=None
    ),
)
class EmailConfigurationViewSet(viewsets.ModelViewSet):
    queryset = EmailConfiguration.objects.all()

    def get_serializer_class(self):
        if self.action in ["create", "update"]:
            return EmailConfigurationCreateSerializer
        return EmailConfigurationSerializer

    @action(detail=True, methods=["post"])
    def send_email(self, request, pk=None):
        email_configuration = EmailConfiguration.objects.get(id=pk)

        send_email(
            template=email_configuration.template,
            subject=email_configuration.subject,
            subtitle=email_configuration.subtitle,
            recipients=email_configuration.recipients.split(","),
        )

        return Response(status=status.HTTP_200_OK, data={"message": "Email sent"})
