import factory

from tapir_mail.models import (
    RELEASE_STATUS_CHOICES,
    EmailConfiguration,
    EmailConfigurationDispatch,
    EmailConfigurationVersion,
    EmailDispatch,
    EmailTemplate,
    StaticSegment,
    StaticSegmentRecipient,
    MailCategory,
    MailCategoryMode,
)
from tapir_mail.registries import MailSegment
from tapir_mail.tests.test_utils import build_time_trigger_dict


class EmailTemplateFactory(factory.django.DjangoModelFactory[EmailTemplate]):
    class Meta:
        model = EmailTemplate

    name = factory.Faker("bs")
    content = factory.lazy_attribute(
        lambda self: open(
            "tapir_mail/tests/dummy_email_template_content.mjml", "r"
        ).read()
    )


class EmailConfigurationFactory(factory.django.DjangoModelFactory[EmailConfiguration]):
    class Meta:
        model = EmailConfiguration

    class Params:
        number_of_recipients = factory.Faker("pyint", min_value=1, max_value=5)

    name = factory.Faker("bs")
    description = factory.Faker("sentence")


class EmailConfigurationVersionFactory(
    factory.django.DjangoModelFactory[EmailConfigurationVersion]
):
    class Meta:
        model = EmailConfigurationVersion

    content = factory.lazy_attribute(
        lambda self: open(
            "tapir_mail/tests/dummy_email_template_content.mjml", "r"
        ).read()
    )
    subject = factory.Faker("sentence")
    email_configuration = factory.SubFactory(EmailConfigurationFactory)
    status = factory.Faker(
        "random_element", elements=[choice[0] for choice in RELEASE_STATUS_CHOICES]
    )
    triggers = [build_time_trigger_dict()]


class EmailConfigurationDispatchFactory(
    factory.django.DjangoModelFactory[EmailConfigurationDispatch]
):
    class Meta:
        model = EmailConfigurationDispatch

    email_configuration_version = factory.SubFactory(EmailConfigurationVersionFactory)
    scheduled_time = factory.Faker(
        "date_this_decade",
        before_today=True,
        after_today=True,
    )
    is_sent = factory.Faker("pybool")


class EmailDispatchFactory(factory.django.DjangoModelFactory[EmailDispatch]):
    class Meta:
        model = EmailDispatch

    email_configuration_dispatch = factory.SubFactory(EmailConfigurationDispatchFactory)
    recipient = factory.Faker("email")
    sent_time = factory.Faker(
        "date_this_decade",
        before_today=True,
        after_today=False,
    )


class StaticSegmentFactory(factory.django.DjangoModelFactory[StaticSegment]):
    class Meta:
        model = StaticSegment

    name = factory.Faker("bs")


class StaticSegmentRecipientFactory(
    factory.django.DjangoModelFactory[StaticSegmentRecipient]
):
    class Meta:
        model = StaticSegmentRecipient

    segment = factory.SubFactory(StaticSegmentFactory)
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.Faker("email")


class MailCategoryFactory(factory.django.DjangoModelFactory[MailCategory]):
    class Meta:
        model = MailCategory

    name = factory.Faker("bs")
    mode = MailCategoryMode.OPTIONAL_DEFAULT_OFF
    available_for_external_recipients = True
    static_segment = factory.SubFactory(StaticSegmentFactory)
    dynamic_segment_name = ""


class MailSegmentFactory(factory.Factory[MailSegment]):
    class Meta:
        model = MailSegment

    label = factory.Faker("word")
    description = factory.Faker("sentence")
    group = factory.Faker("word")
