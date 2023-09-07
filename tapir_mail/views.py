import logging

from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
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
    RecipientSerializer,
)
from tapir_mail.service.email import send_email

LOG = logging.getLogger(__name__)


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
        operation_id="emailconfigurations_send_test_email",
        request={
            "type": "object",
            "properties": {
                "recipients": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["recipients"],
        },
    ),
)
class EmailConfigurationViewSet(viewsets.ModelViewSet):
    queryset = EmailConfiguration.objects.all()

    def get_serializer_class(self):
        if self.action in ["create", "update"]:
            return EmailConfigurationCreateSerializer
        return EmailConfigurationSerializer

    @extend_schema(
        request=RecipientSerializer,
        responses={200: OpenApiTypes.OBJECT},
        operation_id="emailconfigurations_send_test_email",
    )
    @action(detail=True, methods=["post"])
    def send_test_email(self, request, pk=None):
        email_configuration = get_object_or_404(EmailConfiguration, id=pk)
        recipients = request.data.get("recipients", None)

        if recipients is None:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"message": "Recipients parameter is required"},
            )

        try:
            recipients_list = [email.strip() for email in recipients]
        except Exception as e:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"message": f"Invalid recipients parameter: {str(e)}"},
            )
        send_email(
            template=email_configuration.template,
            subject=email_configuration.subject,
            subtitle=email_configuration.subtitle,
            recipients=recipients_list,
        )

        LOG.info("Test email sent to: " + ", ".join(recipients_list))

        return Response(
            status=status.HTTP_200_OK,
            data={"message": f"Test email sent to: {', '.join(recipients_list)}"},
        )
