import datetime
import logging
from dataclasses import dataclass

from django.db import models
from django.utils import timezone

from tapir_mail.models import (
    EmailConfigurationVersion,
    ReleaseStatus,
    EmailConfigurationDispatch,
)
from tapir_mail.service.segment import segment_data_to_recipient_list
from tapir_mail.service.triggers import Trigger
from tapir_mail_server.dummy_accounts.models import DummySubscription

LOG = logging.getLogger(__name__)


@dataclass
class DaysTriggerData:
    number_of_days: int


class DaysAfterSubscriptionStartTrigger(Trigger[DaysTriggerData]):
    @classmethod
    def get_scheduled_date(cls, email_configuration_version, data):
        # Unused
        pass

    @classmethod
    def get_id(cls) -> str:
        return f"{__name__}.days_after_subscription"

    @classmethod
    def get_display_name(cls) -> str:
        return "Days after subscription"

    @classmethod
    def _on_create(cls, email_configuration_version: EmailConfigurationVersion):
        for recipient in segment_data_to_recipient_list(
            email_configuration_version.segment_data
        ):
            if not hasattr(recipient, "dummysubscription_set"):
                LOG.warning(
                    f"Recipient can't receive trigger because of a missing attribute."
                    f"\n\tRecipient: {recipient}"
                    f"\n\tTrigger: {cls}"
                    f"\n\tAttribute: dummysubscription_set"
                )
                continue
            for subscription in recipient.dummysubscription_set.all():
                cls.on_subscription_updated(subscription)

    @classmethod
    def on_subscription_updated(cls, subscription: DummySubscription):
        for version in EmailConfigurationVersion.objects.filter(
            trigger=cls.get_id(), status=ReleaseStatus.RELEASED
        ):
            EmailConfigurationDispatch.objects.filter(
                email_configuration_version=version,
                override_recipients=[subscription.user.email],
                is_sent=False,
            ).delete()
            cls.create_dispatch_if_relevant(version=version, subscription=subscription)

    @staticmethod
    def create_dispatch_if_relevant(
        version: EmailConfigurationVersion, subscription: DummySubscription
    ):
        if subscription.user not in segment_data_to_recipient_list(
            version.segment_data
        ):
            return

        scheduled_time = subscription.start_date + datetime.timedelta(
            days=int(version.trigger_data["number_of_days"])
        )
        if scheduled_time <= timezone.now().date():
            return

        EmailConfigurationDispatch.objects.create(
            email_configuration_version=version,
            override_recipients=[subscription.user.email],
            scheduled_time=scheduled_time,
            is_sent=False,
        )

    @classmethod
    def get_field_definitions(cls) -> [Trigger.FieldDefinition]:
        return [
            cls.FieldDefinition(
                field_name="number_of_days",
                type="number",
                label="Days before/after subscription start",
            )
        ]


def on_subscription_updated(instance: DummySubscription, **kwargs):
    DaysAfterSubscriptionStartTrigger.on_subscription_updated(instance)


models.signals.post_save.connect(on_subscription_updated, sender=DummySubscription)
