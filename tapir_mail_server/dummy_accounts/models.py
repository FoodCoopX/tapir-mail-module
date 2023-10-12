from django.db import models
from django.utils.translation import gettext_lazy as _


class DummyTapirUser(models.Model):
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(_("email address"), blank=True)
    pickup_location = models.CharField(max_length=255, blank=True)
    has_coop_shares = models.BooleanField(default=False)

    @property
    def subscription_type(self):
        return f"2 × M-Ernteanteil"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"User: {self.email} (#{self.id})"


class DummySubscription(models.Model):
    user = models.ForeignKey(DummyTapirUser, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    cancellation_ts = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Subscription: {self.user.email} (#{self.id})"
