from django.db import models
from django.utils.translation import gettext_lazy as _


class DummyTapirUser(models.Model):
    email = models.EmailField(_("email address"), blank=True)

    def __str__(self):
        return f"User: {self.email} (#{self.id})"
