import datetime

from tapir_mail.service.segment import register_base_segment
from tapir_mail.service.token import register_tokens
from tapir_mail_server.dummy_accounts.models import DummyTapirUser

# Folgende Grundmengen sollen in einem ersten Schritt angelegt werden und vom Standort-Admin auswählbar sein:

# 1. Alle Tapir-Nutzer der Organisation (Grundmenge)
# 2. Alle die einen Genossenschaftsanteil haben. (Genosse)
# 3. Alle, die keinen Genossenschaftsanteil haben.
# 4. Alle, die einen laufenden Erntevertrag haben.
# 5. Alle, die keinen laufenden Erntevertrag haben.
# 6. Eine statische Nutzermenge (Tabelle) mit Mailadressen (=Mitarbeitende der Organisation und Stakeholder ohne Tapir-Mitgliedsaccount; wird vom Admin gepflegt)


def register_base_segment_and_tokens():
    register_base_segment(DummyTapirUser.objects.all())
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
