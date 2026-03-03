from dataclasses import dataclass

from tapir_mail.models import EmailConfigurationVersion
from tapir_mail.service.triggers import Trigger


@dataclass
class SimpleAccountTriggerData:
    target_email: str


class OnAccountCreatedTrigger(Trigger[SimpleAccountTriggerData]):
    @classmethod
    def get_recipients_override(
        cls,
        email_configuration_version: EmailConfigurationVersion,
        data: SimpleAccountTriggerData,
    ):
        return [data.target_email]

    @classmethod
    def get_id(cls):
        return f"{__name__}.on_dummy_account_created"

    @classmethod
    def get_display_name(cls):
        return "On account created"


class OnAccountUpdatedTrigger(Trigger[SimpleAccountTriggerData]):
    @classmethod
    def get_recipients_override(
        cls,
        email_configuration_version: EmailConfigurationVersion,
        data: SimpleAccountTriggerData,
    ):
        return [data.target_email]

    @classmethod
    def get_id(cls):
        return f"{__name__}.on_dummy_account_updated"

    @classmethod
    def get_display_name(cls):
        return "On account updated"
