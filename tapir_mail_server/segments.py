import datetime

from tapir_mail.service.segment import (
    register_base_segment,
    register_filter,
    register_segment,
)
from tapir_mail.service.token import register_tokens
from tapir_mail_server.dummy_accounts.models import DummyTapirUser, DummyPickupLocation


# Folgende Grundmengen sollen in einem ersten Schritt angelegt werden und vom Standort-Admin auswählbar sein:

# 1. Alle Tapir-Nutzer der Organisation (Grundmenge)
# 2. Alle die einen Genossenschaftsanteil haben. (Genosse)
# 3. Alle, die keinen Genossenschaftsanteil haben.
# 4. Alle, die einen laufenden Erntevertrag haben.
# 5. Alle, die keinen laufenden Erntevertrag haben.
# 6. Eine statische Nutzermenge (Tabelle) mit Mailadressen (=Mitarbeitende der Oragnisation und Stakeholder ohne Tapir-Mitgliedsaccount; wird vom Admin gepflegt)


def register_all():
    register_base_segment(DummyTapirUser.objects.all())
    register_segments()
    register_filters()
    register_tokens(
        user_tokens={
            "Vorname": "first_name",
            "Nachname": "last_name",
            "Email": "email",
            "Abholort": "pickup_location",
            "Ernteanteilsgröße": "subscription_type",
        },
        general_tokens={
            "WirGarten Standort": lambda: "WirGarten Lüneburg eG",
            "Admin Name": "Max Mustermann",
            "Admin Email": "max.mustermann@example.com",
        },
        dynamic_tokens={
            "Test token Now": lambda recipient, cache: str(datetime.datetime.now())
        },
    )


def register_segments():
    def coop_members():
        return DummyTapirUser.objects.filter(has_coop_shares=True)

    def not_coop_members():
        return DummyTapirUser.objects.filter(has_coop_shares=False)

    register_segment("Geno-Mitglieder", coop_members)
    register_segment("Nicht Geno-Mitglied", not_coop_members)
    register_segment("Mit laufendem Ertevertrag", coop_members)
    register_segment("Kein laufender Ertevertrag", not_coop_members)


def register_filters():
    def build_pickup_location_filter(location: DummyPickupLocation):
        return lambda queryset: queryset.filter(pickup_location=location)

    for pickup_location in DummyPickupLocation.objects.all():
        register_filter(
            f"Abholort = '{pickup_location.name}'",
            build_pickup_location_filter(pickup_location),
        )
