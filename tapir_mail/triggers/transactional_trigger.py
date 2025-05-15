import datetime
from dataclasses import dataclass

from dateutil.relativedelta import relativedelta
from django.utils import timezone

from tapir_mail.service.triggers import Trigger


@dataclass
class TransactionalTriggerData:
    key: str
    recipient_email: str
    recipient_email_override: str | None
    token_data: dict


@dataclass
class TransactionalTriggerDataDropdownFieldChoice(
    Trigger.DropdownFieldDefinition.Choice
):
    tokens: dict


class TransactionalTrigger(Trigger[TransactionalTriggerData]):
    transactional_trigger_registry = {}
    trigger_tokens = {}
    required_trigger_to_default_content_map = {}

    @classmethod
    def register_action(
        cls, name, key, tokens: dict = None, required=False, default_content=None
    ):
        if tokens is None:
            tokens = {}
        cls.transactional_trigger_registry[key] = name
        if tokens:
            cls.trigger_tokens[key] = tokens
        if required:
            if default_content is None:
                raise ValueError(
                    "If the trigger is required, the default content must valid MJML content"
                )
            cls.required_trigger_to_default_content_map[key] = default_content

    @classmethod
    def fire_action(
        cls, key, recipient_email, recipient_email_override=None, token_data=None
    ):
        if token_data is None:
            token_data = {}

        if key not in cls.transactional_trigger_registry:
            raise Exception(
                f"Action '{key}' not registered. Available: {set(cls.transactional_trigger_registry.keys())}"
            )

        known_tokens = cls.trigger_tokens.get(key, {})
        for label, token_key in known_tokens.items():
            if token_key not in token_data:
                raise ValueError(
                    f"Token '{token_key}' ({label}) is required for action '{key}'."
                )

        for token_key in token_data:
            if token_key not in known_tokens.values():
                raise ValueError(
                    f"Token '{token_key}' not known for action '{key}'. Available: {set(known_tokens.values())}"
                )

        cls.fire_all_released_configs(
            TransactionalTriggerData(
                key=key,
                recipient_email=recipient_email,
                recipient_email_override=recipient_email_override,
                token_data=token_data,
            )
        )

    @classmethod
    def fire_all_released_configs(cls, data: TransactionalTriggerData):
        from tapir_mail.models import EmailConfigurationVersion, ReleaseStatus

        for version in EmailConfigurationVersion.objects.filter(
            status=ReleaseStatus.RELEASED,
        ):
            for trigger in (
                t for t in version.triggers or [] if t.get("trigger_id") == cls.get_id()
            ):
                if trigger["trigger_field_values"]["key"] == data.key:
                    cls.fire_version(
                        version,
                        data,
                    )

    @classmethod
    def fire_version(cls, email_configuration_version, data: TransactionalTriggerData):
        from tapir_mail.models import EmailConfigurationDispatch

        translated_token_data = {}
        trigger_tokens = cls.trigger_tokens.get(data.key, {})
        for key, value in data.token_data.items():
            translated_token_data[
                cls.transactional_trigger_registry[data.key]
                + "."
                + [k for k, value in trigger_tokens.items() if value == key][0]
            ] = value

        EmailConfigurationDispatch.objects.create(
            email_configuration_version=email_configuration_version,
            override_recipients=cls.get_recipients_override(
                email_configuration_version=email_configuration_version, data=data
            ),
            scheduled_time=cls.get_scheduled_date(email_configuration_version, data),
            is_sent=False,
            additional_tokens=translated_token_data,
        )

    @classmethod
    def get_recipients_override(
        cls, email_configuration_version, data: TransactionalTriggerData
    ) -> list[str | tuple[str, str]]:
        return [
            (
                data.recipient_email
                if data.recipient_email_override is None
                else (data.recipient_email, data.recipient_email_override)
            )
        ]

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
        return [
            cls.DropdownFieldDefinition(
                field_name="key",
                label="Aktion auswählen",
                choices=[
                    Trigger.DropdownFieldDefinition.Choice(value=key, label=label)
                    for key, label in cls.transactional_trigger_registry.items()
                ],
            )
        ]
