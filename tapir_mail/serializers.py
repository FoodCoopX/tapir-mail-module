from rest_framework import serializers

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationVersion,
    EmailTemplate,
    EmailDispatch,
)
from tapir_mail.service.triggers import trigger_registry


class TriggerSerializationMixin(metaclass=serializers.SerializerMetaclass):
    trigger = serializers.CharField(allow_null=True, required=False)
    trigger_data = serializers.JSONField(allow_null=True, required=False)

    @staticmethod
    def validate_trigger(trigger_id):
        if trigger_id and trigger_id not in trigger_registry.keys():
            raise serializers.ValidationError(f"Invalid trigger id : {trigger_id}")
        return trigger_id

    @staticmethod
    def validate(data):
        if not data["trigger"]:
            return data

        expected_fields = [
            field.field_name
            for field in trigger_registry[data["trigger"]].get_field_definitions()
        ]
        received_fields = data["trigger_data"].keys()

        missing_fields = [
            field for field in expected_fields if field not in received_fields
        ]

        if missing_fields:
            raise serializers.ValidationError(
                f"Invalid trigger data. Missing fields: {missing_fields}"
            )

        return data


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = "__all__"


class EmailConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfiguration
        fields = "__all__"


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
    id = serializers.CharField()
    email_configuration_version = EmailConfigurationVersionSerializer()
    scheduled_time = serializers.DateTimeField()
    segment_data = SegmentDataSerializer(allow_null=True, required=False)


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
