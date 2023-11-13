import datetime
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Generic, TypeVar

from django.utils import timezone

TriggerData = TypeVar("TriggerData")


class Trigger(Generic[TriggerData], ABC):
    @dataclass
    class FieldDefinition:
        label: str
        type: str
        field_name: str
        additional_data: dict = field(default_factory=dict)

    @dataclass
    class DropdownFieldDefinition(FieldDefinition):
        @dataclass
        class Choice:
            label: str
            value: str

        type: str = field(init=False, default="dropdown")
        choices: list[Choice] = field(default_factory=list)

        def __post_init__(self):
            self.additional_data["choices"] = [
                dict(label=choice.label, value=choice.value) for choice in self.choices
            ]

    @classmethod
    def fire_all_released_configs(cls, data: TriggerData):
        from tapir_mail.models import EmailConfigurationVersion, ReleaseStatus

        for version in EmailConfigurationVersion.objects.filter(
            trigger=cls.get_id(), status=ReleaseStatus.RELEASED
        ):
            cls.fire_version(email_configuration_version=version, data=data)

    @classmethod
    def fire_version(cls, email_configuration_version, data: TriggerData):
        from tapir_mail.models import EmailConfigurationDispatch

        EmailConfigurationDispatch.objects.create(
            email_configuration_version=email_configuration_version,
            override_recipients=cls.get_recipients_override(
                email_configuration_version=email_configuration_version, data=data
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
    def on_email_configuration_version_create(email_configuration_version):
        if (
            not email_configuration_version.trigger
            or email_configuration_version.trigger not in trigger_registry.keys()
        ):
            return
        trigger_registry[email_configuration_version.trigger]._on_create(
            email_configuration_version
        )

    @classmethod
    def _on_create(cls, email_configuration_version):
        # Override this method if your trigger must for example fire on create
        pass

    @classmethod
    def after_mail_sent(cls, email_configuration_dispatch):
        # Override this if you want to repeat the trigger after it's been sent,
        # for example for a weekly trigger
        pass

    @classmethod
    def validate_data_and_return_object(cls, trigger_data):
        # Override this if you want to validate the content of the trigger_data variable from EmailConfigurationVersion
        pass


trigger_registry: Dict[str, type[Trigger]] = {}


def register_trigger(trigger: type[Trigger]):
    trigger_registry[trigger.get_id()] = trigger
