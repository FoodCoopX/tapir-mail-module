from django.apps import AppConfig

from tapir_mail.registries import (
    mail_segment_providers,
    MailSegmentRegistry,
    mail_segment_filter_providers,
)
from tapir_mail.triggers.transactional_trigger import TransactionalTrigger


class TapirMailServerAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail_server"

    def ready(self):
        from .segments import register_base_segment_and_tokens

        register_base_segment_and_tokens()
        mail_segment_providers.add(self.provide_mail_segments)
        mail_segment_filter_providers.add(self.provide_mail_segments_filter)

        TransactionalTrigger.register_action(
            "Absenden Bestell Wizard (Mitgliedschaft + Ernteanteile)",
            "register_coop_shares_and_harvest_shares",
        )
        TransactionalTrigger.register_action(
            "Absenden Bestell Wizard (nur Mitgliedschaft)",
            "register_coop_shares",
            required=True,
            default_content=open(
                "tapir_mail/default_mail_content/register_coop_shares.mjml", "r"
            ).read(),
        )

        TransactionalTrigger.register_action(
            "Vertragsänderungen im Mitgliederbereich",
            "update_contract",
        )

        TransactionalTrigger.register_action(
            "Mitgliedsdatenänderungen",
            "update_member",
            {"Geänderte Daten": "changed_fields"},
            required=False,
        )

    @staticmethod
    def provide_mail_segments() -> MailSegmentRegistry:
        from tapir_mail_server.dummy_accounts.models import DummyTapirUser

        def coop_members():
            return DummyTapirUser.objects.filter(has_coop_shares=True)

        def not_coop_members():
            return DummyTapirUser.objects.filter(has_coop_shares=False)

        return {
            "Alle Benutzer": DummyTapirUser.objects.all,
            "Geno-Mitglieder": coop_members,
            "Nicht Geno-Mitglied": not_coop_members,
            "Mit laufendem Ertevertrag": coop_members,
            "Kein laufender Ertevertrag": not_coop_members,
        }

    @staticmethod
    def provide_mail_segments_filter():
        from tapir_mail_server.dummy_accounts.models import DummyPickupLocation

        def build_pickup_location_filter(location: DummyPickupLocation):
            return lambda queryset: queryset.filter(pickup_location=location)

        return {
            f"Abholort = '{pickup_location.name}'": build_pickup_location_filter(
                pickup_location
            )
            for pickup_location in DummyPickupLocation.objects.all()
        }
