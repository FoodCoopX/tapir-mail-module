import factory

from tapir_mail.models import EmailConfiguration, EmailTemplate


class EmailTemplateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EmailTemplate

    name = factory.Faker("bs")
    content = factory.lazy_attribute(
        lambda self: open(
            "tapir_mail/tests/dummy_email_template_content.json", "r"
        ).read()
    )
    html = factory.lazy_attribute(
        lambda self: open("tapir_mail/tests/dummy_email_template_html.html", "r").read()
    )


class EmailConfigurationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EmailConfiguration

    class Params:
        number_of_recipients = factory.Faker("pyint", min_value=1, max_value=5)

    name = factory.Faker("bs")
    description = factory.Faker("sentence")
    template = factory.SubFactory(EmailTemplateFactory)
    subject = factory.Faker("sentence")
    subtitle = factory.Faker("sentence")
    recipients = factory.LazyAttribute(
        lambda self: [factory.Faker("email")] * self.number_of_recipients
    )
