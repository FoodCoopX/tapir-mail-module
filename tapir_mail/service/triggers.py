import datetime
from abc import abstractmethod, ABC
from dataclasses import dataclass
from typing import Dict, Generic, TypeVar

from tapir_mail.models import EmailConfigurationVersion, EmailConfigurationDispatch

TriggerData = TypeVar("TriggerData")


class Trigger(Generic[TriggerData], ABC):
    @dataclass
    class FieldDefinition:
        label: str
        type: str
        field_name: str

    @classmethod
    def fire_all_released_configs(cls, data: TriggerData):
        from tapir_mail.models import ReleaseStatus

        for version in EmailConfigurationVersion.objects.filter(
            trigger=cls.get_id(), status=ReleaseStatus.RELEASED
        ):
            cls.fire_version(version, data)

    @classmethod
    def fire_version(cls, version: EmailConfigurationVersion, data: TriggerData):
        from tapir_mail.models import EmailConfigurationDispatch

        EmailConfigurationDispatch.objects.create(
            email_configuration_version=version,
            override_recipients=cls.get_recipients_override(version, data),
            scheduled_time=cls.get_scheduled_date(version, data),
            is_sent=False,
        )

    @classmethod
    @abstractmethod
    def get_scheduled_date(
        cls, email_configuration_version, data: TriggerData
    ) -> datetime.datetime:
        pass

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
    def on_create(trigger_id, trigger_data: TriggerData):
        if not trigger_id or trigger_id not in trigger_registry.keys():
            return
        trigger_registry[trigger_id]._on_create(trigger_data)

    @classmethod
    def _on_create(cls, version: EmailConfigurationVersion, trigger_data: TriggerData):
        # Override this method if your trigger must for example fire on create
        pass


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
    def _on_create(
        cls, version: EmailConfigurationVersion, trigger_data: TimeTriggerData
    ):
        EmailConfigurationDispatch.objects.filter(
            email_configuration_version__email_configuration=version.email_configuration
        ).delete()
        cls.fire_version(version, trigger_data)


trigger_registry: Dict[str, type[Trigger]] = {}


def register_trigger(trigger: type[Trigger]):
    trigger_registry[trigger.get_id()] = trigger
