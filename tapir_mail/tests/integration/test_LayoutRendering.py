from django.core import mail

from tapir_mail.models import EmailTemplateType, ReleaseStatus
from tapir_mail.service.email_dispatch import SendEmailBatch
from tapir_mail.tests.factories import (
    EmailConfigurationDispatchFactory,
    EmailConfigurationVersionFactory,
    EmailTemplateFactory,
)
from tapir_mail.tests.integration.utils import TestUtils
from tapir_mail.tests.test_utils import TapirIntegrationTest


class LayoutRenderingTest(TapirIntegrationTest):
    def setUp(self):
        super().setUp()
        self.layout = EmailTemplateFactory.create(
            template_type=EmailTemplateType.LAYOUT,
            content=open("tapir_mail/tests/dummy_layout_template_content.mjml").read(),
        )
        self.version = EmailConfigurationVersionFactory.create(
            status=ReleaseStatus.RELEASED,
            layout_enabled=True,
            layout_template=self.layout,
        )
        self.config_dispatch = EmailConfigurationDispatchFactory.create(
            email_configuration_version=self.version,
        )

    def _send_one(self):
        TestUtils.create_email_dispatches(
            1,
            config_dispatch=self.config_dispatch,
            recipient_prefix="layout",
        )
        SendEmailBatch.send_email_dispatches()

    def test_layoutEnabled_explicitLayout_wrapsBody(self):
        self._send_one()

        self.assertEqual(1, len(mail.outbox))
        body = mail.outbox[0].body
        self.assertIn("LAYOUT HEADER", body)
        self.assertIn("This is a dummy email!", body)
        self.assertIn("LAYOUT FOOTER", body)

    def test_layoutEnabled_noExplicitLayout_usesGlobalDefault(self):
        self.layout.is_default_layout = True
        self.layout.save()
        self.version.layout_template = None
        self.version.save()

        self._send_one()

        self.assertEqual(1, len(mail.outbox))
        body = mail.outbox[0].body
        self.assertIn("LAYOUT HEADER", body)
        self.assertIn("This is a dummy email!", body)

    def test_layoutDisabled_existingVersion_unchanged(self):
        self.version.layout_enabled = False
        self.version.save()

        self._send_one()

        self.assertEqual(1, len(mail.outbox))
        body = mail.outbox[0].body
        self.assertNotIn("LAYOUT HEADER", body)
        self.assertIn("This is a dummy email!", body)

    def test_layoutEnabled_noLayoutAvailable_noLayoutApplied(self):
        self.version.layout_template = None
        self.version.save()

        self._send_one()

        self.assertEqual(1, len(mail.outbox))
        body = mail.outbox[0].body
        self.assertNotIn("LAYOUT HEADER", body)
        self.assertIn("This is a dummy email!", body)
