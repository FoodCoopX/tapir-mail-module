from django.contrib import admin

from tapir_mail_server.dummy_accounts.models import DummyTapirUser

# Register your models here.

admin.site.register(DummyTapirUser)
