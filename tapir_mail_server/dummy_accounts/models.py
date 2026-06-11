import calendar

from django.db import models
from django.utils.translation import gettext_lazy as _

WEEKDAY_CHOICES = [
    (i, _(calendar.day_name[i])) for i in calendar.Calendar().iterweekdays()
]


class DummyPickupLocation(models.Model):
    name = models.CharField(max_length=255, unique=True)
    delivery_day = models.IntegerField(choices=WEEKDAY_CHOICES)


class DummyTapirUser(models.Model):
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(_("email address"), blank=True)
    pickup_location = models.ForeignKey(DummyPickupLocation, on_delete=models.PROTECT)
    has_coop_shares = models.BooleanField(default=False)
    iban = models.CharField(max_length=100, blank=True)

    @property
    def subscription_type(self):
        return "2 × M-Ernteanteil"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"User: {self.email} ({self.pickup_location.name}) (#{self.id})"


class DummySubscription(models.Model):
    user = models.ForeignKey(DummyTapirUser, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    cancellation_ts = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Subscription: {self.user.email} {self.start_date} (#{self.id})"
