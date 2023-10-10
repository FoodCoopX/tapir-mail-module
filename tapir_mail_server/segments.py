from datetime import date

from tapir_mail.models import StaticSegment
from tapir_mail.service.segment import (
    register_filter,
    register_segment,
)
from tapir_mail_server.dummy_accounts.models import DummyTapirUser

# Folgende Grundmengen sollen in einem ersten Schritt angelegt werden und vom Standort-Admin auswählbar sein:

# 1. Alle Tapir-Nutzer der Organisation (Grundmenge)
# 2. Alle die einen Genossenschaftsanteil haben. (Genosse)
# 3. Alle, die keinen Genossenschaftsanteil haben.
# 4. Alle, die einen laufenden Erntevertrag haben.
# 5. Alle, die keinen laufenden Erntevertrag haben.
# 6. Eine statische Nutzermenge (Tabelle) mit Mailadressen (=Mitarbeitende der Oragnisation und Stakeholder ohne Tapir-Mitgliedsaccount; wird vom Admin gepflegt)


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
    def pickup_location(location):
        return lambda queryset: queryset.filter(pickup_location=location)

    # dynamic filter example:
    pickup_locations = ["WirGarten Lüneburg", "Edeka Bergmann", "Garage am Finkenberg"]
    for pl in pickup_locations:
        register_filter(f"Abholort = '{pl}'", pickup_location(pl))
