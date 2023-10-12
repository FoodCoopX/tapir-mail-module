from rest_framework import viewsets

from tapir_mail_server.dummy_accounts.models import DummyTapirUser
from tapir_mail_server.dummy_accounts.serializers import DummyTapirUserSerializer
from tapir_mail_server.dummy_accounts.triggers import (
    OnAccountCreatedTrigger,
    OnAccountUpdatedTrigger,
    SimpleAccountTriggerData,
)


class DummyTapirUserViewSet(viewsets.ModelViewSet):
    queryset = DummyTapirUser.objects.order_by("email")
    serializer_class = DummyTapirUserSerializer

    def create(self, request, *args, **kwargs):
        result = super().create(request, *args, **kwargs)
        OnAccountCreatedTrigger.fire_all_released_configs(
            SimpleAccountTriggerData(target_email=result.data["email"])
        )
        return result

    def update(self, request, *args, **kwargs):
        result = super().update(request, *args, **kwargs)
        OnAccountUpdatedTrigger.fire_all_released_configs(
            SimpleAccountTriggerData(target_email=result.data["email"])
        )
        return result
