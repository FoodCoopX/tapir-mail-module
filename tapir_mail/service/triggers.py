import datetime
import logging
from abc import abstractmethod, ABC
from dataclasses import dataclass
from typing import Dict, Generic, TypeVar

from django.utils import timezone
from rest_framework import serializers

TriggerData = TypeVar("TriggerData")

LOG = logging.getLogger(__name__)


class Trigger(Generic[TriggerData], ABC):
    @dataclass
    class FieldDefinition:
        label: str
        type: str
        field_name: str

    @classmethod
    def fire_all_released_configs(cls, data: TriggerData):
        from tapir_mail.models import ReleaseStatus

        from tapir_mail.models import EmailConfigurationVersion

        for version in EmailConfigurationVersion.objects.filter(
            status=ReleaseStatus.RELEASED
        ):
            if cls.get_id() not in [
                trigger["trigger_id"] for trigger in version.triggers
            ]:
                continue
            cls.fire_version(version, data)

    @classmethod
    def fire_version(cls, email_configuration_version, data: TriggerData):
        from tapir_mail.models import EmailConfigurationDispatch

        EmailConfigurationDispatch.objects.create(
            email_configuration_version=email_configuration_version,
            override_recipients=cls.get_recipients_override(
                email_configuration_version, data
            ),
            scheduled_time=cls.get_scheduled_date(email_configuration_version, data),
            is_sent=False,
        )

    @classmethod
    def get_scheduled_date(
        cls, email_configuration_version, data: TriggerData
    ) -> datetime.datetime:
        return timezone.now()

    @classmethod
    def get_recipients_override(
        cls, email_configuration_version, data: TriggerData
    ) -> [str]:
        return None

    @classmethod
    @abstractmethod
    def get_id(cls) -> str:
        pass

    @classmethod
    @abstractmethod
    def get_display_name(cls) -> str:
        pass

    @classmethod
    def get_field_definitions(cls) -> [FieldDefinition]:
        return []

    @staticmethod
    def on_email_configuration_version_save(email_configuration_version):
        from tapir_mail.models import ReleaseStatus, EmailConfigurationDispatch

        if email_configuration_version.status != ReleaseStatus.RELEASED:
            EmailConfigurationDispatch.objects.filter(
                email_configuration_version=email_configuration_version
            ).delete()
            return

        EmailConfigurationDispatch.objects.filter(
            email_configuration_version__email_configuration=email_configuration_version.email_configuration
        ).delete()

        if not email_configuration_version.triggers:
            return

        for trigger_data in email_configuration_version.triggers:
            trigger_id = trigger_data["trigger_id"]
            if trigger_id not in trigger_registry.keys():
                LOG.warning(
                    f"EmailConfigurationVersion "
                    f"{email_configuration_version.id} {email_configuration_version.email_configuration.name} "
                    f"has an unknown trigger : {trigger_id}"
                )
                continue
            trigger_class = trigger_registry[trigger_id]
            trigger_class._on_create(
                email_configuration_version,
                trigger_class.validate_field_values_and_return_object(
                    trigger_data["trigger_field_values"]
                ),
            )

    @classmethod
    def _on_create(cls, email_configuration_version, trigger_data: TriggerData):
        # Override this method if your trigger must for example fire on create
        pass

    @classmethod
    def after_mail_sent(cls, email_configuration_dispatch):
        # Override this if you want to repeat the trigger after it's been sent,
        # for example for a weekly trigger
        pass

    @classmethod
    def validate_field_values_and_return_object(cls, trigger_field_values):
        # Override this if you want to validate the content of the trigger_field_values variable
        # from EmailConfigurationVersion
        return None


@dataclass
class TimeTriggerData:
    scheduled_time: datetime.datetime


class TimeTrigger(Trigger[TimeTriggerData]):
    @classmethod
    def get_scheduled_date(
        cls, email_configuration_version, data: TimeTriggerData
    ) -> datetime.datetime:
        return data.scheduled_time

    @classmethod
    def get_id(cls) -> str:
        return f"{__name__}.time_trigger"

    @classmethod
    def get_display_name(cls) -> str:
        return "Time trigger"

    @classmethod
    def get_field_definitions(cls) -> [Trigger.FieldDefinition]:
        return [
            cls.FieldDefinition(
                field_name="scheduled_time", type="datetime", label="Scheduled time"
            )
        ]

    @classmethod
    def _on_create(cls, email_configuration_version, trigger_data: TimeTriggerData):
        cls.fire_version(
            email_configuration_version,
            trigger_data,
        )

    @classmethod
    def validate_field_values_and_return_object(cls, trigger_field_values):
        try:
            scheduled_time = datetime.datetime.fromisoformat(
                trigger_field_values["scheduled_time"]
            )
        except ValueError as ve:
            raise serializers.ValidationError(
                f"Invalid value for scheduled_time: {trigger_field_values['scheduled_time']}, error: {ve}"
            )
        return TimeTriggerData(scheduled_time=scheduled_time)


trigger_registry: Dict[str, type[Trigger]] = {}


def register_trigger(trigger: type[Trigger]):
    trigger_registry[trigger.get_id()] = trigger
