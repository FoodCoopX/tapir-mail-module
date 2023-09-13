import logging
from datetime import datetime

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationDispatch,
    EmailConfigurationVersion,
    EmailTemplate,
    ReleaseStatus,
)
from tapir_mail.serializers import (
    BundledEmailConfigurationSerializer,
    EmailConfigurationCreateSerializer,
    EmailConfigurationDispatchSerializer,
    EmailConfigurationSerializer,
    EmailConfigurationVersionSerializer,
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


class EmailConfigurationViewSet(viewsets.ModelViewSet):
    queryset = EmailConfiguration.objects.all()

    def get_serializer_class(self):
        if self.action in ["create", "update"]:
            return EmailConfigurationCreateSerializer
        return EmailConfigurationSerializer

    @extend_schema(
        responses={200: EmailConfigurationVersionSerializer(many=True)},
    )
    @action(detail=True, methods=["GET"])
    def versions(self, request, pk=None):
        email_configuration = get_object_or_404(EmailConfiguration, id=pk)
        versions = email_configuration.versions.all()
        serializer = EmailConfigurationVersionSerializer(versions, many=True)
        return Response(serializer.data)


@extend_schema_view(
    send_email=extend_schema(
        operation_id="email_configuration_version_send_test_email",
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
class EmailConfigurationVersionViewSet(viewsets.ModelViewSet):
    queryset = EmailConfigurationVersion.objects.all()

    def get_serializer_class(self):
        if self.action in ["create", "update"]:
            return BundledEmailConfigurationSerializer
        return EmailConfigurationVersionSerializer

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = BundledEmailConfigurationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create EmailConfiguration
        email_configuration = EmailConfiguration.objects.get_or_create(
            name=serializer.validated_data["name"],
        )[0]
        email_configuration.description = (serializer.validated_data["description"],)
        email_configuration.save()

        # Create EmailConfigurationVersion
        version = EmailConfigurationVersion.objects.create(
            email_configuration=email_configuration,
            content=serializer.validated_data["content"],
            subject=serializer.validated_data["subject"],
            subtitle=serializer.validated_data["subtitle"],
            status=serializer.validated_data["release_status"],
        )

        if version.status == ReleaseStatus.RELEASED:
            EmailConfigurationVersion.objects.filter(
                email_configuration=email_configuration,
                status=ReleaseStatus.RELEASED,
            ).exclude(id=version.id).update(status=ReleaseStatus.ARCHIVED)

        # Create EmailConfigurationDispatch
        email_config_dispatch = EmailConfigurationDispatch.objects.get_or_create(
            email_configuration_version=version,
        )[0]
        email_config_dispatch.recipients = serializer.validated_data["recipients"]
        email_config_dispatch.scheduled_time = serializer.validated_data[
            "scheduled_time"
        ]
        email_config_dispatch.save()

        return Response({"id": version.id}, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, pk=None, *args, **kwargs):
        version = self.get_object()
        email_configuration = version.email_configuration

        # Get existing dispatch instance
        dispatch_instance = EmailConfigurationDispatch.objects.get_or_create(
            email_configuration_version=version
        )

        initial_data = {
            "name": email_configuration.name,
            "description": email_configuration.description,
            "content": version.content,
            "subject": version.subject,
            "subtitle": version.subtitle,
            "release_status": version.status,
            "scheduled_time": dispatch_instance.scheduled_time,
            "recipients": dispatch_instance.recipients
            if dispatch_instance.recipients
            else "",
        }
        serializer = BundledEmailConfigurationSerializer(
            data=request.data, initial=initial_data
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Update EmailConfiguration
        email_configuration.name = serializer.validated_data["name"]
        email_configuration.description = serializer.validated_data["description"]
        email_configuration.save()

        # Update EmailConfigurationVersion
        version.content = serializer.validated_data["content"]
        version.subject = serializer.validated_data["subject"]
        version.subtitle = serializer.validated_data["subtitle"]
        version.status = serializer.validated_data["release_status"]
        version.save()

        if version.status == ReleaseStatus.RELEASED:
            EmailConfigurationVersion.objects.filter(
                email_configuration=email_configuration,
                status=ReleaseStatus.RELEASED,
            ).exclude(id=version.id).update(status=ReleaseStatus.ARCHIVED)

        # Update EmailConfigurationDispatch
        dispatch_instance.scheduled_time = serializer.validated_data["scheduled_time"]
        dispatch_instance.recipients = serializer.validated_data["recipients"]
        dispatch_instance.save()

        return Response(serializer.data)

    @extend_schema(responses={200: BundledEmailConfigurationSerializer})
    @action(detail=True, methods=["GET"])
    def get_bundled_info(self, request, pk=None):
        version = self.get_object()
        email_configuration = version.email_configuration

        # Get existing dispatch instance
        try:
            dispatch_instance = EmailConfigurationDispatch.objects.get(
                email_configuration_version=version
            )
        except EmailConfigurationDispatch.DoesNotExist:
            dispatch_instance = None

        bundled_data = {
            "name": email_configuration.name,
            "description": email_configuration.description,
            "content": version.content,
            "subject": version.subject,
            "subtitle": version.subtitle,
            "release_status": version.status,
            "recipients": dispatch_instance.recipients
            if dispatch_instance and dispatch_instance.recipients
            else "",
            "scheduled_time": dispatch_instance.scheduled_time
            if dispatch_instance
            else None,
        }

        return Response(bundled_data, status=status.HTTP_200_OK)

    @transaction.atomic
    def destroy(self, request, pk=None, *args, **kwargs):
        version = self.get_object()
        EmailConfigurationDispatch.objects.filter(
            email_configuration_version=version
        ).delete()
        version.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        request=None,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=["POST"])
    def release(self, request, pk=None):
        version = self.get_object()
        version.release()
        return Response({"status": ReleaseStatus.RELEASED})

    @extend_schema(
        request=None,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=["POST"])
    def archive(self, request, pk=None):
        version = self.get_object()
        version.archive()
        return Response({"status": ReleaseStatus.ARCHIVED})

    @extend_schema(
        request=None,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=["POST"])
    def draft(self, request, pk=None):
        version = self.get_object()
        version.status = ReleaseStatus.DRAFT
        version.save()
        return Response({"status": ReleaseStatus.DRAFT})

    @extend_schema(
        request=RecipientSerializer,
        responses={200: OpenApiTypes.OBJECT},
        operation_id="email_configuration_version_send_test_email",
    )
    @action(detail=True, methods=["post"])
    def send_test_email(self, request, pk=None):
        email_version_configuration = get_object_or_404(
            EmailConfigurationVersion, id=pk
        )
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
            mjml=email_version_configuration.content,
            subject=email_version_configuration.subject,
            subtitle=email_version_configuration.subtitle,
            recipients=recipients_list,
        )

        LOG.info("Test email sent to: " + ", ".join(recipients_list))

        return Response(
            status=status.HTTP_200_OK,
            data={"message": f"Test email sent to: {', '.join(recipients_list)}"},
        )


class EmailConfigurationDispatchViewSet(viewsets.ModelViewSet):
    queryset = EmailConfigurationDispatch.objects.select_related(
        "email_configuration_version"
    ).all()
    serializer_class = EmailConfigurationDispatchSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="limit",
                description="Number of last sent email dispatches to retrieve",
                required=False,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
            )
        ],
        responses={200: EmailConfigurationDispatchSerializer(many=True)},
    )
    @action(detail=False)
    def last_sent(self, request):
        limit = int(request.query_params.get("limit", 10))
        now = timezone.now()
        last_n_objects = EmailConfigurationDispatch.objects.filter(
            scheduled_time__lt=now
        ).order_by("-scheduled_time")[:limit]
        serializer = EmailConfigurationDispatchSerializer(last_n_objects, many=True)
        return Response(serializer.data)
