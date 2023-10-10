from rest_framework import serializers

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationVersion,
    EmailTemplate,
    EmailDispatch,
)
from tapir_mail.service.triggers import trigger_registry


class TriggerValidationMixin:
    @staticmethod
    def validate_trigger(trigger_id):
        if trigger_id and trigger_id not in trigger_registry.keys():
            raise serializers.ValidationError(f"Invalid trigger id : {trigger_id}")
        return trigger_id


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = "__all__"


class EmailConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfiguration
        fields = "__all__"


class EmailConfigurationVersionSerializer(
    TriggerValidationMixin, serializers.ModelSerializer
):
    email_configuration = EmailConfigurationSerializer()

    class Meta:
        model = EmailConfigurationVersion
        fields = "__all__"


class RecipientSerializer(serializers.Serializer):
    recipients = serializers.ListField(child=serializers.EmailField(), required=True)


class BundledEmailConfigurationSerializer(
    TriggerValidationMixin, serializers.Serializer
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
    trigger = serializers.CharField(allow_null=True, required=False)

    # EmailConfigurationDispatch fields
    scheduled_time = serializers.DateTimeField()
    segment_data = serializers.JSONField(allow_null=True, required=False)


class SegmentDataSerializer(serializers.Serializer):
    add_segments = serializers.ListField(child=serializers.CharField(), required=False)
    static_segments = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    remove_segments = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    filter_list = serializers.ListField(child=serializers.CharField(), required=False)


class EmailConfigurationDispatchSerializer(serializers.Serializer):
    id = serializers.CharField()
    email_configuration_version = EmailConfigurationVersionSerializer()
    scheduled_time = serializers.DateTimeField()
    segment_data = SegmentDataSerializer(allow_null=True, required=False)


class TriggerSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()


class EmailDispatchSerializer(serializers.ModelSerializer):
    email_configuration_dispatch = EmailConfigurationDispatchSerializer()

    class Meta:
        model = EmailDispatch
        fields = "__all__"
