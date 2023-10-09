from django.utils import timezone

from tapir_mail.models import EmailConfigurationVersion
from tapir_mail.service.triggers import Trigger


class OnAccountCreatedTrigger(Trigger):
    @classmethod
    def get_recipients(
        cls, version: EmailConfigurationVersion, email_of_created_account: str
    ):
        return [email_of_created_account]

    @classmethod
    def get_id(cls):
        return f"{__name__}.on_dummy_account_created"

    @classmethod
    def get_display_name(cls):
        return "On account created"

    @classmethod
    def get_scheduled_date(cls, version: EmailConfigurationVersion):
        return timezone.now()


class OnAccountUpdatedTrigger(Trigger):
    @classmethod
    def get_recipients(
        cls, version: EmailConfigurationVersion, email_of_updated_account: str
    ):
        return [email_of_updated_account]

    @classmethod
    def get_id(cls):
        return f"{__name__}.on_dummy_account_updated"

    @classmethod
    def get_display_name(cls):
        return "On account updated"

    @classmethod
    def get_scheduled_date(cls, version: EmailConfigurationVersion):
        return timezone.now()
