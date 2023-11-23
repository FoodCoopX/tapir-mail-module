import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from rest_framework.response import Response

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationDispatch,
    EmailConfigurationVersion,
    EmailDispatch,
    EmailTemplate,
    ReleaseStatus,
    StaticSegment,
)
from tapir_mail.serializers import (
    BundledEmailConfigurationSerializer,
    EmailConfigurationDispatchSerializer,
    EmailConfigurationSerializer,
    EmailConfigurationVersionSerializer,
    EmailDispatchSerializer,
    EmailTemplateSerializer,
    RecipientSerializer,
    SegmentDataSerializer,
    TriggerDefinitionSerializer,
)
from tapir_mail.service.email import prepare_email
from tapir_mail.service.segment import (
    filter_registry,
    resolve_segments,
    segment_registry,
)
from tapir_mail.service.token import replace_tokens, token_registry
from tapir_mail.service.tracking import track_email_opening
from tapir_mail.service.triggers import Trigger, trigger_registry

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
    serializer_class = EmailTemplateSerializer
    pagination_class = LimitOffsetPagination


class EmailConfigurationViewSet(viewsets.ModelViewSet):
    queryset = EmailConfiguration.objects.all().distinct()
    filterset_fields = ["versions__status"]
    serializer_class = EmailConfigurationSerializer
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        return super().get_queryset().order_by("-updated_at")

    @extend_schema(
        responses={200: EmailConfigurationVersionSerializer(many=True)},
    )
    @action(detail=True, methods=["GET"])
    def versions(self, request, pk=None):
        email_configuration = get_object_or_404(EmailConfiguration, id=pk)
        pagination = self.pagination_class()
        queryset = email_configuration.versions.all().order_by("-updated_at")
        pagination.count = pagination.limit = queryset.count()
        pagination.offset = 0
        serializer = EmailConfigurationVersionSerializer(queryset, many=True)
        return pagination.get_paginated_response(serializer.data)


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
    serializer_class = BundledEmailConfigurationSerializer

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
        email_configuration.description = (
            (serializer.validated_data["description"],)
            if "description" in serializer.validated_data
            else None
        )
        email_configuration.save()

        release_status = serializer.validated_data["release_status"]
        if release_status == ReleaseStatus.RELEASED:
            for old_released_version in EmailConfigurationVersion.objects.filter(
                email_configuration=email_configuration,
                status=ReleaseStatus.RELEASED,
            ):
                old_released_version.archive()

        # Create EmailConfigurationVersion
        new_version = EmailConfigurationVersion.objects.create(
            email_configuration=email_configuration,
            content=serializer.validated_data["content"],
            subject=serializer.validated_data.get("subject", None),
            status=release_status,
            triggers=serializer.validated_data.get("triggers", None),
            segment_data=serializer.validated_data.get("segment_data", None),
        )

        Trigger.on_email_configuration_version_save(new_version)

        return Response({"id": new_version.id}, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, pk=None, *args, **kwargs):
        updated_version: EmailConfigurationVersion = self.get_object()
        email_configuration = updated_version.email_configuration

        initial_data = {
            "name": email_configuration.name,
            "description": email_configuration.description,
            "content": updated_version.content,
            "subject": updated_version.subject,
            "release_status": updated_version.status,
            "segment_data": updated_version.segment_data,
            "triggers": updated_version.triggers,
        }
        serializer = BundledEmailConfigurationSerializer(
            data=request.data, initial=initial_data
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Update EmailConfiguration
        email_configuration.name = serializer.validated_data["name"]
        email_configuration.description = serializer.validated_data.get(
            "description", None
        )
        email_configuration.save()

        release_status = serializer.validated_data["release_status"]
        if release_status == ReleaseStatus.RELEASED:
            for old_released_version in EmailConfigurationVersion.objects.filter(
                email_configuration=email_configuration,
                status=ReleaseStatus.RELEASED,
            ).exclude(id=updated_version.id):
                old_released_version.archive()

        # Update EmailConfigurationVersion
        updated_version.content = serializer.validated_data["content"]
        updated_version.subject = serializer.validated_data.get("subject", None)
        updated_version.status = release_status
        updated_version.triggers = serializer.validated_data.get("triggers", None)
        updated_version.segment_data = serializer.validated_data.get(
            "segment_data", None
        )
        updated_version.save()

        Trigger.on_email_configuration_version_save(updated_version)

        return Response(serializer.data)

    @extend_schema(responses={200: BundledEmailConfigurationSerializer})
    @action(detail=True, methods=["GET"])
    def get_bundled_info(self, request, pk=None):
        version: EmailConfigurationVersion = self.get_object()
        email_configuration = version.email_configuration

        serializer = BundledEmailConfigurationSerializer(
            {
                "name": email_configuration.name,
                "description": email_configuration.description,
                "content": version.content,
                "subject": version.subject,
                "updated_at": version.updated_at,
                "release_status": version.status,
                "segment_data": version.segment_data,
                "triggers": version.triggers,
            }
        )

        return Response(serializer.data)

    @transaction.atomic
    def destroy(self, request, pk=None, *args, **kwargs):
        version = self.get_object()
        EmailConfigurationDispatch.objects.filter(
            email_configuration_version=version
        ).delete()
        version.delete()

        if (
            EmailConfigurationVersion.objects.filter(
                email_configuration=version.email_configuration
            ).count()
            == 0
        ):
            version.email_configuration.delete()

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
        mjml = replace_tokens(
            email_version_configuration.content,
            {"email": email for email in recipients_list},
        )
        email = prepare_email(
            mjml=mjml,
            subject=email_version_configuration.subject,
            recipients=recipients_list,
        )
        email.send()

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
    pagination_class = LimitOffsetPagination
    DEFAULT_LIMIT = 10

    @extend_schema(
        responses={200: EmailConfigurationDispatchSerializer(many=True)},
    )
    @action(detail=False)
    def last_sent(self, request: Request):
        pagination = self.pagination_class()
        queryset = EmailConfigurationDispatch.objects.filter(is_sent=True).order_by(
            "-scheduled_time"
        )
        objects = pagination.paginate_queryset(queryset, request)
        serializer = EmailConfigurationDispatchSerializer(objects, many=True)
        return pagination.get_paginated_response(serializer.data)

    @extend_schema(
        responses={200: EmailConfigurationDispatchSerializer(many=True)},
        description="Returns the list of email config dispatch that will be sent next.",
    )
    @action(detail=False)
    def next_sends(self, request):
        pagination = self.pagination_class()
        queryset = (
            EmailConfigurationDispatch.objects.filter(is_sent=False)
            .exclude(email_configuration_version__status=ReleaseStatus.ARCHIVED)
            .order_by("scheduled_time")
        )
        objects = pagination.paginate_queryset(queryset, request)
        serializer = EmailConfigurationDispatchSerializer(objects, many=True)
        return pagination.get_paginated_response(serializer.data)


class TriggerListView(viewsets.ViewSet):
    @extend_schema(
        responses={
            200: TriggerDefinitionSerializer,
        },
        description="Get a list of available triggers.",
    )
    def list(self, request):
        serializer = TriggerDefinitionSerializer(
            [
                {
                    "id": trigger.get_id(),
                    "name": trigger.get_display_name(),
                    "field_definitions": trigger.get_field_definitions(),
                }
                for trigger in trigger_registry.values()
            ],
            many=True,
        )
        return Response(serializer.data)


class EmailDispatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailDispatch.objects.all().order_by("-sent_time")
    serializer_class = EmailDispatchSerializer


class SegmentAndFilterViewSet(viewsets.ViewSet):
    @extend_schema(
        responses={
            200: {
                "type": "object",
                "properties": {
                    "filters": {"type": "array", "items": {"type": "string"}}
                },
            }
        },
        description="Get a list of available filters.",
    )
    @action(detail=False, methods=["GET"])
    def available_filters(self, request):
        available_filters = list(filter_registry.keys())
        return Response({"filters": available_filters})

    @extend_schema(
        responses={
            200: {
                "type": "object",
                "properties": {
                    "segments": {"type": "array", "items": {"type": "string"}},
                    "staticSegments": {"type": "array", "items": {"type": "string"}},
                },
            }
        },
        description="Get a list of available segments.",
    )
    @action(detail=False, methods=["GET"])
    def available_segments(self, request):
        static_segments = [
            x["name"]
            for x in StaticSegment.objects.filter(recipients__isnull=False)
            .distinct()
            .values("name")
        ]

        available_segments = list(segment_registry.keys())
        return Response(
            {"segments": available_segments, "staticSegments": static_segments}
        )

    @extend_schema(
        request=SegmentDataSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "count": {"type": "integer"},
                    "recipients": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "email": {"type": "string"},
                            },
                        },
                    },
                },
            },
        },
        description="Combine segments and filters and get the result.",
    )
    @action(detail=False, methods=["POST"])
    def combine(self, request):
        add_segments = request.data.get("add_segments", [])
        static_segments = request.data.get("static_segments", [])
        remove_segments = request.data.get("remove_segments", [])
        filter_list = request.data.get("filter_list", [])

        try:
            combined = resolve_segments(
                add_segments=add_segments,
                static_segments=static_segments,
                remove_segments=remove_segments,
                filter_list=filter_list,
            )
            return Response(
                {
                    "count": len(combined),
                    "recipients": [
                        {"name": f"{r}", "email": r.email} for r in combined
                    ],
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TokensView(viewsets.ViewSet):
    @extend_schema(
        responses={200: {"type": "object"}},
    )
    @action(detail=False, methods=["get"])
    def get_tokens(self, request, *args, **kwargs):
        all_tokens = {}
        for token_type, tokens in token_registry.items():
            all_tokens[token_type] = list(tokens.keys())

        return Response(all_tokens, status=status.HTTP_200_OK)


class TrackingView(viewsets.ViewSet):
    @extend_schema(
        responses={200: None},
    )
    @action(detail=True, methods=["GET"], url_path="track")
    def track(self, request, pk=None, *args, **kwargs):
        try:
            with transaction.atomic():
                try:
                    email_dispatch = EmailDispatch.objects.get(id=pk)
                except EmailDispatch.DoesNotExist:
                    LOG.error(f"EmailDispatch with id {pk} not found")
                    return Response(None, status=status.HTTP_200_OK)

                track_email_opening(email_dispatch)

        except Exception as e:
            LOG.error(f"Error while tracking email opening: {type(e)}: {str(e)}")

        return Response(None, status=status.HTTP_200_OK)
