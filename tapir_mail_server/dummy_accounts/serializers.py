from rest_framework import serializers

from tapir_mail_server.dummy_accounts.models import DummyTapirUser, DummyPickupLocation


class DummyPickupLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DummyPickupLocation
        fields = "__all__"


class DummyTapirUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = DummyTapirUser
        fields = "__all__"

    pickup_location = DummyPickupLocationSerializer()
