from rest_framework import serializers

from tapir_mail_server.dummy_accounts.models import DummyTapirUser, DummyContract


class DummyTapirUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = DummyTapirUser
        fields = "__all__"


class DummyContractSerializer(serializers.ModelSerializer):
    tapir_user = DummyTapirUserSerializer()

    class Meta:
        model = DummyContract
        fields = "__all__"
