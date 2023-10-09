from rest_framework import viewsets

from tapir_mail_server.dummy_accounts.models import DummyTapirUser
from tapir_mail_server.dummy_accounts.serializers import DummyTapirUserSerializer
from tapir_mail_server.dummy_accounts.triggers import (
    OnAccountCreatedTrigger,
    OnAccountUpdatedTrigger,
)


class DummyTapirUserViewSet(viewsets.ModelViewSet):
    queryset = DummyTapirUser.objects.order_by("email")
    serializer_class = DummyTapirUserSerializer

    def create(self, request, *args, **kwargs):
        result = super().create(request, *args, **kwargs)
        OnAccountCreatedTrigger.fire(result.data["email"])
        return result

    def update(self, request, *args, **kwargs):
        result = super().update(request, *args, **kwargs)
        OnAccountUpdatedTrigger.fire(result.data["email"])
        return result
