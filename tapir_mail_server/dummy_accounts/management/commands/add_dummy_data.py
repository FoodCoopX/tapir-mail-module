from datetime import datetime, timedelta
from random import choice

from django.core.management.base import BaseCommand

from tapir_mail_server.dummy_accounts.models import (
    DummySubscription,
    DummyTapirUser,
)
from tapir_mail_server.dummy_accounts.tests.factories import DummyTapirUserFactory


class Command(BaseCommand):
    help = "Adds random users and subscriptions"

    def add_arguments(self, parser):
        parser.add_argument(
            "total", type=int, help="Indicates the number of users to be created"
        )

    def handle(self, *args, **kwargs):
        total = kwargs["total"]
        for _ in range(total):
            DummyTapirUserFactory.create()

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
