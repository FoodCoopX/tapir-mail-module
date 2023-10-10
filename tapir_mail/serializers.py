from rest_framework import serializers

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationVersion,
    EmailTemplate,
)


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = "__all__"


class EmailConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfiguration
        fields = "__all__"


class EmailConfigurationVersionSerializer(serializers.ModelSerializer):
    email_configuration = EmailConfigurationSerializer()

    class Meta:
        model = EmailConfigurationVersion
        fields = "__all__"


class RecipientSerializer(serializers.Serializer):
    recipients = serializers.ListField(child=serializers.EmailField(), required=True)


class BundledEmailConfigurationSerializer(serializers.Serializer):
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
