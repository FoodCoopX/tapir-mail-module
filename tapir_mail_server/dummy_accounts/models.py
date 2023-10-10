from django.db import models
from django.utils.translation import gettext_lazy as _

from tapir_mail_server.dummy_accounts.model_utils import DurationModelMixin


class DummyTapirUser(models.Model):
    email = models.EmailField(_("email address"), blank=True)
    pickup_location = models.CharField(max_length=255, blank=True)
    has_coop_shares = models.BooleanField(default=False)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)

    def __str__(self):
        return f"User: {self.email} (#{self.id})"


class DummyContract(DurationModelMixin, models.Model):
    tapir_user = models.ForeignKey(DummyTapirUser, on_delete=models.CASCADE)


class DummySubscription(models.Model):
    user = models.ForeignKey(DummyTapirUser, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    cancellation_ts = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Subscription: {self.user.email} (#{self.id})"
