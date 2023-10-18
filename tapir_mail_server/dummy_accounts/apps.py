from django.apps import AppConfig

from tapir_mail.service.triggers import register_trigger


class DummyAccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail_server.dummy_accounts"

    def ready(self):
        from tapir_mail_server.dummy_accounts.triggers.account_triggers import (
            OnAccountCreatedTrigger,
            OnAccountUpdatedTrigger,
        )

        register_trigger(OnAccountCreatedTrigger)
        register_trigger(OnAccountUpdatedTrigger)

        from tapir_mail_server.dummy_accounts.triggers.days_after_subscription_start_trigger import (
            DaysAfterSubscriptionStartTrigger,
        )

        register_trigger(DaysAfterSubscriptionStartTrigger)

        from tapir_mail_server.dummy_accounts.triggers.days_before_delivery_trigger import (
            DaysBeforeDeliveryTrigger,
        )

        register_trigger(DaysBeforeDeliveryTrigger)
