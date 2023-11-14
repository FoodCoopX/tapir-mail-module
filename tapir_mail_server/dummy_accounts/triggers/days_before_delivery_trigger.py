import datetime
import logging

from django.db import models
from django.utils import timezone

from tapir_mail.models import (
    EmailConfigurationVersion,
    ReleaseStatus,
    EmailConfigurationDispatch,
)
from tapir_mail.service.segment import resolve_segments
from tapir_mail.service.triggers import Trigger
from tapir_mail_server.dummy_accounts.models import DummyPickupLocation, DummyTapirUser
from tapir_mail_server.dummy_accounts.triggers.days_after_subscription_start_trigger import (
    DaysTriggerData,
)

LOG = logging.getLogger(__name__)


class DaysBeforeDeliveryTrigger(Trigger[DaysTriggerData]):
    # TODO simplify and fix to have a single delivery day.
    @staticmethod
    def get_next_weekday(target_weekday: int):
        today = timezone.now().date()
        days_ahead = target_weekday - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return today + datetime.timedelta(days_ahead)

    @classmethod
    def get_id(cls) -> str:
        return f"{__name__}.days_before_delivery_trigger"

    @classmethod
    def get_display_name(cls) -> str:
        return "Days before delivery"

    @classmethod
    def _on_create(
        cls,
        email_configuration_version: EmailConfigurationVersion,
        trigger_data: DaysTriggerData,
    ):
        for recipient in resolve_segments(**email_configuration_version.segment_data):
            cls._delete_unsent_config_dispatch(
                version=email_configuration_version, recipient=recipient
            )
            if not hasattr(recipient, "pickup_location"):
                LOG.warning(
                    f"Recipient can't receive trigger because of a missing attribute."
                    f"\n\tRecipient: {recipient}"
                    f"\n\tTrigger: {cls}"
                    f"\n\tAttribute: pickup_location"
                )
                continue
            cls._create_new_config_dispatch(
                version=email_configuration_version, recipient=recipient
            )

    @classmethod
    def on_pickup_location_updated(cls, location: DummyPickupLocation):
        for version in EmailConfigurationVersion.objects.filter(
            status=ReleaseStatus.RELEASED
        ):
            if cls.get_id() not in [
                trigger_data["trigger_id"] for trigger_data in version.triggers
            ]:
                continue

            for recipient in segment_data_to_recipient_list(version.segment_data):
                cls._delete_unsent_config_dispatch(version=version, recipient=recipient)
                if (
                    not hasattr(recipient, "pickup_location")
                    or recipient.pickup_location != location
                ):
                    continue
                cls._create_new_config_dispatch(version=version, recipient=recipient)

    @classmethod
    def on_recipient_updated(cls, recipient: DummyTapirUser):
        if not hasattr(recipient, "pickup_location"):
            return
        for version in EmailConfigurationVersion.objects.filter(
            status=ReleaseStatus.RELEASED
        ):
            if cls.get_id() not in [
                trigger_data["trigger_id"] for trigger_data in version.triggers
            ]:
                continue

            if recipient not in segment_data_to_recipient_list(version.segment_data):
                continue

            cls._delete_unsent_config_dispatch(version=version, recipient=recipient)
            cls._create_new_config_dispatch(version=version, recipient=recipient)

    @classmethod
    def _delete_unsent_config_dispatch(
        cls, version: EmailConfigurationVersion, recipient: DummyTapirUser
    ):
        EmailConfigurationDispatch.objects.filter(
            email_configuration_version=version,
            override_recipients=[recipient.email],
            is_sent=False,
        ).delete()

    @classmethod
    def _create_new_config_dispatch(
        cls, version: EmailConfigurationVersion, recipient: DummyTapirUser
    ):
        for trigger_data in version.triggers:
            if trigger_data["trigger_id"] != cls.get_id():
                continue
            EmailConfigurationDispatch.objects.create(
                email_configuration_version=version,
                override_recipients=[recipient.email],
                scheduled_time=cls.get_next_weekday(
                    recipient.pickup_location.delivery_day
                )
                - datetime.timedelta(
                    days=int(trigger_data["trigger_field_values"]["number_of_days"])
                ),
                is_sent=False,
            )

    @classmethod
    def get_field_definitions(cls):
        return [
            cls.FieldDefinition(
                field_name="number_of_days",
                type="number",
                label="Days before delivery",
            )
        ]

    @classmethod
    def after_mail_sent(cls, email_configuration_dispatch: EmailConfigurationDispatch):
        for recipient in DummyTapirUser.objects.filter(
            email__in=email_configuration_dispatch.override_recipients
        ):
            cls._create_new_config_dispatch(
                version=email_configuration_dispatch.email_configuration_version,
                recipient=recipient,
            )


def on_pickup_location_updated(instance: DummyPickupLocation, **kwargs):
    DaysBeforeDeliveryTrigger.on_pickup_location_updated(instance)


models.signals.post_save.connect(on_pickup_location_updated, sender=DummyPickupLocation)


def on_recipient_updated(instance: DummyTapirUser, **kwargs):
    DaysBeforeDeliveryTrigger.on_recipient_updated(instance)


models.signals.post_save.connect(on_recipient_updated, sender=DummyTapirUser)
