from rest_framework import serializers

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationVersion,
    EmailTemplate,
    EmailDispatch,
)
from tapir_mail.service.triggers import trigger_registry


# TODO: Is there a better way to exclude the automatically filled fields? Whatever I tried, I couldn't get the fields to be required=False in the schema.


class ExcludeTimestampMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        exclude_fields = ["created_at", "updated_at"]
        for field_name in exclude_fields:
            self.fields.pop(field_name, None)


class TriggerValidationMixin:
    @staticmethod
    def validate_trigger(trigger_id):
        if trigger_id and trigger_id not in trigger_registry.keys():
            raise serializers.ValidationError(f"Invalid trigger id : {trigger_id}")
        return trigger_id


class EmailTemplateCreateSerializer(ExcludeTimestampMixin, serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = "__all__"


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = "__all__"


class EmailConfigurationCreateSerializer(
    ExcludeTimestampMixin, serializers.ModelSerializer
):
    class Meta:
        model = EmailConfiguration
        fields = "__all__"


class EmailConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfiguration
        fields = "__all__"


class EmailConfigurationVersionCreateSerializer(
    ExcludeTimestampMixin, TriggerValidationMixin, serializers.ModelSerializer
):
    class Meta:
        model = EmailConfigurationVersion
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
    description = serializers.CharField()

    # EmailConfigurationVersion fields
    content = serializers.CharField()
    subject = serializers.CharField()
    subtitle = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    release_status = serializers.CharField()
    updated_at = serializers.DateTimeField(allow_null=True, required=False)
    trigger = serializers.CharField(allow_null=True, required=False)


class EmailConfigurationDispatchSerializer(serializers.Serializer):
    id = serializers.CharField()
    email_configuration_version = EmailConfigurationVersionSerializer()
    scheduled_time = serializers.DateTimeField()
    recipients = serializers.ListField(
        child=serializers.CharField(allow_null=True, allow_blank=True),
        source="get_recipient_list",
    )


class TriggerSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()


class EmailDispatchSerializer(serializers.ModelSerializer):
    email_configuration_dispatch = EmailConfigurationDispatchSerializer()

    class Meta:
        model = EmailDispatch
        fields = "__all__"
