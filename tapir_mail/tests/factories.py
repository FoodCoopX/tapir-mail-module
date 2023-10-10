import factory
from faker import Faker as FakerClass

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationVersion,
    EmailTemplate,
    EmailConfigurationDispatch,
    RELEASE_STATUS_CHOICES,
)


class EmailTemplateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EmailTemplate

    name = factory.Faker("bs")
    content = factory.lazy_attribute(
        lambda self: open(
            "tapir_mail/tests/dummy_email_template_content.mjml", "r"
        ).read()
    )


class EmailConfigurationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EmailConfiguration

    class Params:
        number_of_recipients = factory.Faker("pyint", min_value=1, max_value=5)

    name = factory.Faker("bs")
    description = factory.Faker("sentence")


class EmailConfigurationVersionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EmailConfigurationVersion

    content = factory.lazy_attribute(
        lambda self: open(
            "tapir_mail/tests/dummy_email_template_content.mjml", "r"
        ).read()
    )
    subject = factory.Faker("sentence")
    subtitle = factory.Faker("sentence")
    email_configuration = factory.SubFactory(EmailConfigurationFactory)
    status = factory.Faker(
        "random_element", elements=[choice[0] for choice in RELEASE_STATUS_CHOICES]
    )


class EmailConfigurationDispatchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EmailConfigurationDispatch

    email_configuration_version = factory.SubFactory(EmailConfigurationVersionFactory)
    scheduled_time = factory.Faker(
        "date_this_decade",
        before_today=True,
        after_today=True,
    )
    is_sent = factory.Faker("pybool")

    @factory.lazy_attribute
    def segment_data(self):
        return FakerClass().json(default='{"static_segments": ["test"]}')
