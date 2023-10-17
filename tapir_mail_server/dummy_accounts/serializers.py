from rest_framework import serializers

from tapir_mail_server.dummy_accounts.models import (
    DummyTapirUser,
    DummyPickupLocation,
    WEEKDAY_CHOICES,
)


class DummyPickupLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DummyPickupLocation
        fields = "__all__"


class DummyTapirUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = DummyTapirUser
        fields = "__all__"

    pickup_location = DummyPickupLocationSerializer()


class WeekdaySerializer(serializers.Serializer):
    id = serializers.ChoiceField(choices=[weekday[0] for weekday in WEEKDAY_CHOICES])
    name = serializers.ChoiceField(choices=[weekday[1] for weekday in WEEKDAY_CHOICES])
