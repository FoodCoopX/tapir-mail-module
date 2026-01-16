import datetime
import logging

from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationDispatch,
    EmailConfigurationVersion,
    EmailDispatch,
    EmailTemplate,
    ReleaseStatus,
    StaticSegment,
    StaticSegmentRecipient,
    MailCategory,
)
from tapir_mail.serializers import (
    BundledEmailConfigurationSerializer,
    EmailConfigurationDispatchSerializer,
    EmailConfigurationSerializer,
    EmailConfigurationVersionSerializer,
    EmailDispatchSerializer,
    EmailDispatchWithRetriesSerializer,
    EmailTemplateSerializer,
    GroupedEmailDispatchSerializer,
    RecipientSerializer,
    SegmentDataSerializer,
    TriggerDefinitionSerializer,
    StaticSegmentSerializer,
    StaticSegmentRecipientSerializer,
    MissingTriggerSerializer,
    CreateMissingTriggerMailSerializer,
    MailCategorySerializer,
)
from tapir_mail.service.email import prepare_email
from tapir_mail.service.email_dispatch import RetryEmailDispatch
from tapir_mail.service.segment import (
    filter_registry,
    resolve_segments,
    segment_registry,
)
from tapir_mail.service.token import replace_tokens, token_registry
from tapir_mail.service.tracking import track_email_opening
from tapir_mail.service.triggers import Trigger, trigger_registry
from tapir_mail.triggers.transactional_trigger import TransactionalTrigger

LOG = logging.getLogger(__name__)


class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer


class PaginatedEmailTemplateViewSet(EmailTemplateViewSet):
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

    @extend_schema(
        responses={200: EmailConfigurationSerializer(many=False)},
    )
    @action(detail=True, methods=["GET"])
    def duplicate(self, request, pk=None):
        copy_source = get_object_or_404(EmailConfiguration, id=pk)

        copy_destination = EmailConfiguration(
            name=f"Kopie von: {copy_source.name}",
            description=copy_source.description,
        )
        copy_destination.save()

        self.duplication_best_version(copy_source, copy_destination)

        serializer = EmailConfigurationSerializer(copy_destination, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def duplication_best_version(
        configuration_copy_source: EmailConfiguration,
        configuration_copy_destination: EmailConfiguration,
    ):
        versions = configuration_copy_source.versions.order_by("-updated_at")
        if not versions.exists():
            return

        version_copy_source = versions.filter(status=ReleaseStatus.RELEASED).first()
        if not version_copy_source:
            version_copy_source = versions.filter(status=ReleaseStatus.DRAFT).first()
        if not version_copy_source:
            version_copy_source = versions.filter(status=ReleaseStatus.ARCHIVED).first()
        if not version_copy_source:
            version_copy_source = versions.first()
        if not version_copy_source:
            return

        fields_to_copy = ["content", "subject", "triggers", "segment_data"]
        version_copy_destination = EmailConfigurationVersion(
            **{
                field_name: getattr(version_copy_source, field_name)
                for field_name in fields_to_copy
            },
            email_configuration=configuration_copy_destination,
            status=ReleaseStatus.DRAFT,
        )
        version_copy_destination.save()


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
            strict_token_validation=False,
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

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    @action(detail=True, methods=["post"], url_path="retryall")
    def retry_all_failed(self, request, pk=None):
        email_configuration_dispatch = self.get_object()
        try:
            count = RetryEmailDispatch.retry_all_failed(email_configuration_dispatch)
            return Response({"count": count}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
    queryset = EmailDispatch.objects.filter(next_retry__isnull=True).order_by(
        "-sent_time"
    )
    serializer_class = EmailDispatchSerializer
    pagination_class = LimitOffsetPagination

    @extend_schema(
        responses={200: EmailDispatchWithRetriesSerializer(many=True)},
        parameters=[
            OpenApiParameter(name="dispatch_status", required=False),
            OpenApiParameter(name="config_dispatch_id", required=False),
        ],
    )
    def list(self, request, *args, **kwargs):
        queryset = EmailDispatch.objects.filter(next_retry__isnull=True).order_by(
            "-created_at",
            "-sent_time",
            "-opened_time",
            "recipient",
        )
        config_dispatch_id = request.query_params.get("config_dispatch_id")
        if config_dispatch_id:
            queryset = queryset.filter(
                email_configuration_dispatch__id=config_dispatch_id
            )

        dispatch_status = request.query_params.get("dispatch_status")
        if dispatch_status == EmailDispatch.DispatchStatus.OPENED:
            queryset = queryset.filter(opened_time__isnull=False)
        elif dispatch_status == EmailDispatch.DispatchStatus.ERROR:
            queryset = queryset.filter(error_message__isnull=False)
        elif dispatch_status == EmailDispatch.DispatchStatus.BOUNCED:
            queryset = queryset.filter(bounce_message__isnull=False)
        elif dispatch_status == EmailDispatch.DispatchStatus.SENDING:
            queryset = queryset.filter(
                error_message__isnull=True, sent_time__isnull=True
            )
        elif dispatch_status == EmailDispatch.DispatchStatus.UNKNOWN:
            queryset = queryset.filter(
                opened_time__isnull=True,
                error_message__isnull=True,
                bounce_message__isnull=True,
            )

        pagination = self.pagination_class()
        objects = pagination.paginate_queryset(queryset, request)
        serializer = EmailDispatchWithRetriesSerializer(objects, many=True)
        return pagination.get_paginated_response(serializer.data)

    @extend_schema(responses={200: EmailDispatchSerializer(many=False)})
    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        email_dispatch = get_object_or_404(EmailDispatch, pk=pk)
        try:
            retry_dispatch = RetryEmailDispatch.retry(email_dispatch)
            serialized_retry_dispatch = EmailDispatchSerializer(retry_dispatch)
            return Response(
                data=serialized_retry_dispatch.data, status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        responses={200: GroupedEmailDispatchSerializer(many=True)},
        parameters=[
            OpenApiParameter(name="start_date", required=False, type=datetime.datetime),
            OpenApiParameter(name="end_date", required=False, type=datetime.datetime),
        ],
    )
    @action(detail=False)
    def recipients_with_errors(self, request):
        dispatches = self.get_failed_dispatches_between_dates(request)
        dispatch_count_per_recipient = (
            dispatches.values("recipient")
            .annotate(count=Count("recipient"))
            .order_by("-count")
        )

        pagination = self.pagination_class()
        dispatches = pagination.paginate_queryset(dispatch_count_per_recipient, request)
        serializer = GroupedEmailDispatchSerializer(
            dispatches,
            many=True,
        )
        return pagination.get_paginated_response(serializer.data)

    def get_failed_dispatches_between_dates(self, request):
        dispatches = EmailDispatch.objects.with_error(True)
        start_date = request.query_params.get("start_date", None)
        if start_date:
            dispatches = dispatches.filter(sent_time__gte=start_date)
        end_date = request.query_params.get("end_date", None)
        if end_date:
            dispatches = dispatches.filter(sent_time__lte=end_date)
        return dispatches

    @extend_schema(
        responses={200: EmailDispatchSerializer(many=True)},
        parameters=[
            OpenApiParameter(name="start_date", required=False, type=datetime.datetime),
            OpenApiParameter(name="end_date", required=False, type=datetime.datetime),
            OpenApiParameter(name="recipient", required=True, type=str),
        ],
    )
    @action(detail=False)
    def get_failed_dispatches(self, request):
        dispatches = self.get_failed_dispatches_between_dates(request)
        dispatches = dispatches.filter(recipient=request.query_params.get("recipient"))

        pagination = self.pagination_class()
        objects = pagination.paginate_queryset(dispatches, request)
        serializer = EmailDispatchSerializer(objects, many=True)
        return pagination.get_paginated_response(serializer.data)


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
        try:
            combined = resolve_segments(**request.data)
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
    permission_classes = []

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


class TransactionalTriggerTokenView(viewsets.ViewSet):
    @extend_schema(
        responses={200: {"type": "object"}},
    )
    @action(detail=False, methods=["get"])
    def get_tokens(self, request, *args, **kwargs):
        trigger_tokens = {}
        for trigger_id, tokens in TransactionalTrigger.trigger_tokens.items():
            trigger_tokens[trigger_id] = {
                TransactionalTrigger.transactional_trigger_registry[trigger_id]: list(
                    tokens.keys()
                )
            }
        return Response(trigger_tokens, status=status.HTTP_200_OK)


class StaticSegmentViewSet(viewsets.ModelViewSet):
    queryset = StaticSegment.objects.all()
    serializer_class = StaticSegmentSerializer


class StaticSegmentRecipientViewSet(viewsets.ModelViewSet):
    queryset = StaticSegmentRecipient.objects.all()
    serializer_class = StaticSegmentRecipientSerializer


class MissingTriggersView(APIView):
    @extend_schema(
        responses={200: MissingTriggerSerializer(many=True)},
    )
    def get(self, request):
        released_versions = list(
            EmailConfigurationVersion.objects.filter(status=ReleaseStatus.RELEASED)
        )
        keys_without_released_version = []
        for key, required in TransactionalTrigger.required_triggers.items():
            if callable(required):
                required = required()
            if not required:
                continue
            if not self.does_trigger_show_in_given_versions(
                trigger_key=key, released_versions=released_versions
            ):
                keys_without_released_version.append(key)

        draft_versions = list(
            EmailConfigurationVersion.objects.filter(status=ReleaseStatus.DRAFT)
        )
        keys_with_draft_version = []
        for key in keys_without_released_version:
            if self.does_trigger_show_in_given_versions(
                trigger_key=key, released_versions=draft_versions
            ):
                keys_with_draft_version.append(key)

        data = [
            {
                "key": key,
                "name": TransactionalTrigger.transactional_trigger_registry[key],
                "draft_version_exists": key in keys_with_draft_version,
            }
            for key in keys_without_released_version
        ]
        return Response(
            MissingTriggerSerializer(data, many=True).data,
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def does_trigger_show_in_given_versions(trigger_key, released_versions):
        for version in released_versions:
            if not version.triggers:
                continue
            for trigger in version.triggers:
                if (
                    trigger["trigger_id"] == TransactionalTrigger.get_id()
                    and trigger.get("trigger_field_values", {}).get("key", None)
                    == trigger_key
                ):
                    return True
        return False


class CreateMissingTriggerMailView(APIView):
    @extend_schema(
        responses={200: str},
        request=CreateMissingTriggerMailSerializer,
    )
    @transaction.atomic
    def post(self, request):
        serializer = CreateMissingTriggerMailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trigger_key = serializer.validated_data["trigger_key"]
        if (
            TransactionalTrigger.required_trigger_to_default_content_map.get(
                trigger_key, None
            )
            is None
        ):
            raise ValueError(f"No default content available for key {trigger_key}")

        email_configuration = EmailConfiguration.objects.create(
            name=f"Entwurf für wichtige Trigger: {TransactionalTrigger.transactional_trigger_registry[trigger_key]}, "
            + timezone.now().strftime("%d.%m.%Y %H:%M:%S")
        )

        content = serializer.validated_data["empty_mjml"]
        insert_index = content.find("</mj-body>")
        content = (
            content[:insert_index]
            + TransactionalTrigger.required_trigger_to_default_content_map[trigger_key]
            + content[insert_index:]
        )

        EmailConfigurationVersion.objects.create(
            content=content,
            subject="TODO",
            email_configuration=email_configuration,
            status=ReleaseStatus.DRAFT,
            triggers=[
                {
                    "trigger_id": TransactionalTrigger.get_id(),
                    "trigger_field_values": {"key": trigger_key},
                }
            ],
            segment_data={
                "add_segments": [],
                "static_segments": [],
                "static_segments_subtractive": [],
                "remove_segments": [],
                "filter_list": [],
            },
        )

        return Response("OK", status=status.HTTP_200_OK)


class MailCategoryViewSet(viewsets.ModelViewSet):
    queryset = MailCategory.objects.all()
    serializer_class = MailCategorySerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = MailCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        static_segment = StaticSegment.objects.create(
            name=f"Mail-Kategory:{data["name"]}"
        )

        category = MailCategory.objects.create(
            name=data["name"],
            mode=data["mode"],
            available_for_external_recipients=data["available_for_external_recipients"],
            static_segment=static_segment,
        )

        return Response(
            MailCategorySerializer(category).data,
            status=status.HTTP_201_CREATED,
        )

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance: MailCategory = self.get_object()
        static_segment = instance.static_segment
        instance.delete()
        static_segment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
