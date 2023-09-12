import factory

from tapir_mail.models import (
    EmailConfiguration,
    EmailConfigurationVersion,
    EmailTemplate,
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
    recipients = factory.LazyAttribute(
        lambda self: [factory.Faker("email")] * self.number_of_recipients
    )


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
