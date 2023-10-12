from rest_framework import serializers

from tapir_mail_server.dummy_accounts.models import DummyTapirUser


class DummyTapirUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = DummyTapirUser
        fields = "__all__"
