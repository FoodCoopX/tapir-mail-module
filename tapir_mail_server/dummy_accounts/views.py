from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.response import Response

from tapir_mail_server.dummy_accounts.models import (
    DummyTapirUser,
    DummyPickupLocation,
    WEEKDAY_CHOICES,
)
from tapir_mail_server.dummy_accounts.serializers import (
    DummyTapirUserSerializer,
    DummyPickupLocationSerializer,
    WeekdaySerializer,
)
from tapir_mail_server.dummy_accounts.triggers.account_triggers import (
    OnAccountCreatedTrigger,
    SimpleAccountTriggerData,
    OnAccountUpdatedTrigger,
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


class DummyPickupLocationViewSet(viewsets.ModelViewSet):
    queryset = DummyPickupLocation.objects.order_by("name")
    serializer_class = DummyPickupLocationSerializer


class WeekdaysListView(viewsets.ViewSet):
    @extend_schema(
        responses={
            200: WeekdaySerializer,
        },
        description="Get a list of id<->weekday combinations.",
    )
    def list(self, request):
        serializer = WeekdaySerializer(
            [{"id": weekday[0], "name": weekday[1]} for weekday in WEEKDAY_CHOICES],
            many=True,
        )
        return Response(serializer.data)
