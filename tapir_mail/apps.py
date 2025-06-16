import os
import subprocess
from pathlib import Path

from django.apps import AppConfig

from tapir_mail.service.triggers import register_trigger
from tapir_mail.triggers.time_trigger import TimeTrigger
from tapir_mail.triggers.transactional_trigger import TransactionalTrigger


class TapirMailConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail"

    def ready(self):
        register_trigger(TimeTrigger)
        register_trigger(TransactionalTrigger)
