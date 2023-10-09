from django.apps import AppConfig

from tapir_mail.service.triggers import register_trigger


class DummyAccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail_server.dummy_accounts"

    def ready(self):
        from tapir_mail_server.dummy_accounts.triggers import (
            OnAccountCreatedTrigger,
            OnAccountUpdatedTrigger,
        )

        register_trigger(OnAccountCreatedTrigger)
        register_trigger(OnAccountUpdatedTrigger)
