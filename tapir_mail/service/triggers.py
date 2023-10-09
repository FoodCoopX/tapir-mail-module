import datetime
from abc import ABC, abstractmethod
from typing import Dict


class Trigger(ABC):
    @classmethod
    def fire(cls, data):
        for version in cls.get_triggered_configs():
            from tapir_mail.models import EmailConfigurationDispatch

            EmailConfigurationDispatch.objects.create(
                email_configuration_version=version,
                recipients=cls.get_recipients(version, data),
                scheduled_time=cls.get_scheduled_date(version),
                is_sent=False,
            )

    @classmethod
    def get_triggered_configs(cls):
        from tapir_mail.models import EmailConfigurationVersion
        from tapir_mail.models import ReleaseStatus

        return EmailConfigurationVersion.objects.filter(
            trigger=cls.get_id(), status=ReleaseStatus.RELEASED
        )

    @classmethod
    @abstractmethod
    def get_scheduled_date(cls, email_configuration_version) -> datetime.datetime:
        pass

    @classmethod
    @abstractmethod
    def get_recipients(cls, email_configuration_version, data) -> [str]:
        pass

    @classmethod
    @abstractmethod
    def get_id(cls) -> str:
        pass

    @classmethod
    @abstractmethod
    def get_display_name(cls) -> str:
        pass


trigger_registry: Dict[str, type[Trigger]] = {}


def register_trigger(trigger: type[Trigger]):
    trigger_registry[trigger.get_id()] = trigger
