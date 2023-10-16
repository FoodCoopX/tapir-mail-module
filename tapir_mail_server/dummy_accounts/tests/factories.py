import datetime

import factory

from tapir_mail_server.dummy_accounts.models import (
    DummyTapirUser,
    DummySubscription,
    DummyPickupLocation,
    WEEKDAY_CHOICES,
)


class DummyPickupLocationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DummyPickupLocation

    name = factory.Faker("city")
    delivery_day = factory.Faker(
        "random_element", elements=[weekday[0] for weekday in WEEKDAY_CHOICES]
    )


class DummyTapirUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DummyTapirUser

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.Faker("email")
    pickup_location = factory.SubFactory(DummyPickupLocationFactory)
    has_coop_shares = factory.Faker("pybool")


class DummySubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DummySubscription

    user = factory.SubFactory(DummyTapirUserFactory)
    start_date = factory.Faker("date_this_year")
    end_date = factory.LazyAttribute(
        lambda subscription: subscription.start_date + datetime.timedelta(days=300)
    )
    cancellation_ts = factory.Faker("date_this_year")
