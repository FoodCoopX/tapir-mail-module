from django.apps import AppConfig

from tapir_mail.service.triggers import register_trigger, TimeTrigger


class TapirMailConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail"

    def ready(self):
        register_trigger(TimeTrigger)
