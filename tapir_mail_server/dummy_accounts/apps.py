from django.apps import AppConfig

from tapir_mail.service.triggers import register_trigger

TRIGGER_NAME_ON_DUMMY_ACCOUNT_CREATED = f"{__name__}.on_dummy_account_created"
TRIGGER_NAME_ON_DUMMY_ACCOUNT_UPDATED = f"{__name__}.on_dummy_account_edited"


class DummyAccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail_server.dummy_accounts"

    def ready(self):
        register_trigger(TRIGGER_NAME_ON_DUMMY_ACCOUNT_CREATED)
        register_trigger(TRIGGER_NAME_ON_DUMMY_ACCOUNT_UPDATED)
