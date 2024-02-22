from django.apps import AppConfig

from tapir_mail.triggers.transactional_trigger import TransactionalTrigger


class TapirMailServerAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail_server"

    def ready(self):
        try:
            from .segments import register_all

            register_all()

            TransactionalTrigger.register_action(
                "Absenden Bestell Wizard (Mitgliedschaft + Ernteanteile)",
                "register_coop_shares_and_harvest_shares",
            )
            TransactionalTrigger.register_action(
                "Absenden Bestell Wizard (nur Mitgliedschaft)",
                "register_coop_shares",
            )

            TransactionalTrigger.register_action(
                "Vertragsänderungen im Mitgliederbereich",
                "update_contract",
            )

            TransactionalTrigger.register_action(
                "Mitgliedsdatenänderungen",
                "update_member",
                {"Geänderte Daten": "changed_fields"},
            )

        except Exception as e:
            print(e)
            pass
