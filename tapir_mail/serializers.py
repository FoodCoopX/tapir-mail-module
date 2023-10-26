import datetime

from rest_framework import serializers

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationDispatch,
    EmailConfigurationVersion,
    EmailDispatch,
    EmailTemplate,
    StaticSegment,
    ReleaseStatus,
)
from tapir_mail.service.segment import filter_registry, segment_registry
from tapir_mail.service.triggers import trigger_registry


class TriggerSerializationMixin(metaclass=serializers.SerializerMetaclass):
    trigger = serializers.CharField(allow_null=True, required=False)
    trigger_data = serializers.JSONField(allow_null=True, required=False)

    def validate_trigger(self, trigger_id):
        if trigger_id and trigger_id not in trigger_registry.keys():
            raise serializers.ValidationError(f"Invalid trigger id : {trigger_id}")
        return trigger_id

    def validate(self, data):
        if not data["trigger"]:
            return data

        if data["trigger"] not in trigger_registry.keys():
            raise serializers.ValidationError(f"Unknown trigger: {data['trigger']}")

        trigger_class = trigger_registry[data["trigger"]]
        TriggerSerializationMixin.check_for_missing_fields(
            trigger_class, data["trigger_data"]
        )

        trigger_class.validate_data_and_return_object(data["trigger_data"])

        return data

    @staticmethod
    def check_for_missing_fields(trigger_class, trigger_data):
        expected_fields = [
            field.field_name for field in trigger_class.get_field_definitions()
        ]
        received_fields = trigger_data.keys()
        missing_fields = [
            field for field in expected_fields if field not in received_fields
        ]
        if missing_fields:
            raise serializers.ValidationError(
                f"Invalid trigger data. Missing fields: {missing_fields}"
            )


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = "__all__"


class EmailConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfiguration
        fields = "__all__"

    released_date = serializers.SerializerMethodField()
    last_updated_draft_date = serializers.SerializerMethodField()

    def get_released_date(self, obj: EmailConfiguration) -> datetime.datetime | None:
        released_version = obj.versions.filter(status=ReleaseStatus.RELEASED).first()
        return released_version.updated_at if released_version else None

    def get_last_updated_draft_date(
        self, obj: EmailConfiguration
    ) -> datetime.datetime | None:
        last_updated_draft = (
            obj.versions.filter(status=ReleaseStatus.DRAFT)
            .order_by("-updated_at")
            .first()
        )
        return last_updated_draft.updated_at if last_updated_draft else None


class EmailConfigurationVersionSerializer(
    TriggerSerializationMixin, serializers.ModelSerializer
):
    email_configuration = EmailConfigurationSerializer()

    class Meta:
        model = EmailConfigurationVersion
        fields = "__all__"


class RecipientSerializer(serializers.Serializer):
    recipients = serializers.ListField(child=serializers.EmailField(), required=True)


class SegmentDataSerializer(serializers.Serializer):
    add_segments = serializers.ListField(child=serializers.CharField(), required=False)
    static_segments = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    remove_segments = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    filter_list = serializers.ListField(child=serializers.CharField(), required=False)

    def validate_add_segments(self, add_segments):
        return self.validate_segments(add_segments)

    def validate_remove_segments(self, remove_segments):
        return self.validate_segments(remove_segments)

    def validate_segments(self, segments):
        invalid_segments = [
            segment for segment in segments if segment not in segment_registry.keys()
        ]
        if invalid_segments:
            raise serializers.ValidationError(
                f"The following segments are invalid: {invalid_segments}"
            )
        return segments

    def validate_filter_list(self, filter_list):
        invalid_filters = [
            f
            for f in filter_list
            if f not in filter_registry.keys()
            and f not in ["AND", "OR", "NOT", "(", ")"]
        ]
        if invalid_filters:
            raise serializers.ValidationError(
                f"The following filters are invalid: {invalid_filters}"
            )
        return filter_list

    def validate_static_segments(self, static_segments):
        existing_segment_names = [
            segment.name for segment in StaticSegment.objects.all()
        ]
        invalid_segments = [
            segment
            for segment in static_segments
            if segment not in existing_segment_names
        ]
        if invalid_segments:
            raise serializers.ValidationError(
                f"The following static segments are invalid: {invalid_segments}"
            )
        return static_segments


class BundledEmailConfigurationSerializer(
    TriggerSerializationMixin, serializers.Serializer
):
    # EmailConfiguration fields
    name = serializers.CharField()
    description = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )

    # EmailConfigurationVersion fields
    content = serializers.CharField()
    subject = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    subtitle = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    release_status = serializers.CharField()
    updated_at = serializers.DateTimeField(allow_null=True, required=False)
    segment_data = SegmentDataSerializer(allow_null=True, required=False)


class EmailConfigurationDispatchSerializer(serializers.Serializer):
    class Meta:
        model = EmailConfigurationDispatch

    id = serializers.CharField()
    email_configuration_version = EmailConfigurationVersionSerializer()
    scheduled_time = serializers.DateTimeField()
    override_recipients = serializers.JSONField()
    sent_count = serializers.SerializerMethodField()
    opened_count = serializers.SerializerMethodField()
    error_count = serializers.SerializerMethodField()

    def get_sent_count(self, obj) -> int:
        return obj.emaildispatch_set.filter(sent_time__isnull=False).count()

    def get_opened_count(self, obj) -> int:
        return obj.emaildispatch_set.filter(opened_time__isnull=False).count()

    def get_error_count(self, obj) -> int:
        return obj.emaildispatch_set.filter(error_message__isnull=False).count()


class TriggerFieldDefinitionSerializer(serializers.Serializer):
    label = serializers.CharField()
    type = serializers.CharField()
    field_name = serializers.CharField()


class TriggerSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    field_definitions = TriggerFieldDefinitionSerializer(many=True)


class EmailDispatchSerializer(serializers.ModelSerializer):
    email_configuration_dispatch = EmailConfigurationDispatchSerializer()

    class Meta:
        model = EmailDispatch
        fields = "__all__"
