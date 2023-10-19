import os
import subprocess
from django.apps import AppConfig
import pkg_resources

from tapir_mail.service.triggers import register_trigger, TimeTrigger


class TapirMailConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail"

    def ready(self):
        register_trigger(TimeTrigger)
        configure_ui()


def configure_ui():
    script_path = "tapir_mail/scripts/configure_ui.sh"
    output_path = "./tapir_mail/__static__/config.js"

    # If the script is not in the project root, it is probably in the package
    if not os.path.exists(script_path):
        script_path = pkg_resources.resource_filename(
            "tapir_mail", "scripts/configure_ui.sh"
        )
        output_path = "./static/config.js"

    subprocess.run(["bash", script_path, output_path])
