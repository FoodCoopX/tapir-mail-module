from django.apps import AppConfig


class TapirMailServerAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tapir_mail_server"

    def ready(self):
        try:
            from .segments import register_filters, register_segments

            register_segments()
            register_filters()
        except Exception as e:
            print(e)
            pass
