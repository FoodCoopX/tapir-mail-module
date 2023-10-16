import datetime

import factory

from tapir_mail_server.dummy_accounts.models import DummyTapirUser, DummySubscription


class DummyPickupLocations:
    WIRGARTEN = "WirGarten Lüneburg"
    EDEKA = "Edeka Bergmann"
    GARAGE = "Garage am Finkenberg"


class DummyTapirUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DummyTapirUser

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.Faker("email")
    pickup_location = factory.Faker(
        "random_element",
        elements=[
            DummyPickupLocations.WIRGARTEN,
            DummyPickupLocations.EDEKA,
            DummyPickupLocations.GARAGE,
        ],
    )
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
