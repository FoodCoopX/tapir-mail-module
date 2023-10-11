from django.core.management.base import BaseCommand
from django.utils.crypto import get_random_string
from random import choice
from datetime import datetime, timedelta

from tapir_mail_server.dummy_accounts.models import DummySubscription, DummyTapirUser


class Command(BaseCommand):
    help = "Adds random users and subscriptions"

    def add_arguments(self, parser):
        parser.add_argument(
            "total", type=int, help="Indicates the number of users to be created"
        )

    def handle(self, *args, **kwargs):
        total = kwargs["total"]
        for i in range(total):
            DummyTapirUser.objects.create(
                first_name=get_random_string(length=5),
                last_name=get_random_string(length=5),
                email=f"{get_random_string(length=5)}@example.com",
                has_coop_shares=choice([True, False]),
                pickup_location=choice(
                    ["WirGarten Lüneburg", "Edeka Bergmann", "Garage am Finkenberg"]
                ),
            )

        users = DummyTapirUser.objects.all()
        for user in users:
            DummySubscription.objects.create(
                user=user,
                start_date=datetime.now().date(),
                end_date=(datetime.now() + timedelta(days=365)).date(),
                cancellation_ts=None if choice([True, False]) else datetime.now(),
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully added {total} random users and subscriptions"
            )
        )
