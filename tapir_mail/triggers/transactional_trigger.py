import datetime
from dataclasses import dataclass

from dateutil.relativedelta import relativedelta
from django.utils import timezone
from tapir_mail.service.segment import BASE_QUERYSET

from tapir_mail.service.triggers import Trigger


@dataclass
class TransactionalTriggerData:
    key: str
    recipient_email: str


class TransactionalTrigger(Trigger[TransactionalTriggerData]):
    transactional_trigger_registry = {}

    @classmethod
    def register_action(cls, name, key):
        cls.transactional_trigger_registry[key] = name

    @classmethod
    def fire_action(cls, key, recipient_email):
        if key not in cls.transactional_trigger_registry:
            raise Exception(
                f"Action '{key}' not registered. Available: {set(cls.transactional_trigger_registry.keys())}"
            )

        cls.fire_all_released_configs(
            TransactionalTriggerData(key=key, recipient_email=recipient_email)
        )

    @classmethod
    def fire_all_released_configs(cls, data: TransactionalTriggerData):
        from tapir_mail.models import EmailConfigurationVersion, ReleaseStatus

        for version in EmailConfigurationVersion.objects.filter(
            trigger=cls.get_id(),
            status=ReleaseStatus.RELEASED,
            trigger_data__key=data.key,
        ):
            cls.fire_version(version, data)

    @classmethod
    def get_recipients_override(cls, email_configuration_version, data) -> [str]:
        return [data.recipient_email]

    @classmethod
    def get_scheduled_date(
        cls, email_configuration_version, data: TransactionalTriggerData
    ) -> datetime.datetime:
        return timezone.now() - relativedelta(
            minutes=10
        )  # give it higher priority to be send before mass emails

    @classmethod
    def get_id(cls) -> str:
        return f"{__name__}.transactional_trigger"

    @classmethod
    def get_display_name(cls) -> str:
        return "Bei Aktion senden"

    @classmethod
    def get_field_definitions(cls) -> [Trigger.FieldDefinition]:
        Choice = Trigger.DropdownFieldDefinition.Choice
        return [
            cls.DropdownFieldDefinition(
                field_name="key",
                label="Aktion auswählen",
                choices=[
                    Choice(value=key, label=label)
                    for key, label in cls.transactional_trigger_registry.items()
                ],
            )
        ]
