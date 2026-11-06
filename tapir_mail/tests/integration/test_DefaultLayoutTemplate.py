from pathlib import Path

from tapir_mail.models import EmailTemplate, EmailTemplateType
from tapir_mail.service.layout import (
    BODY_PLACEHOLDER_CSS_CLASS,
    apply_layout,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest


class DefaultLayoutTemplateTest(TapirIntegrationTest):
    def test_defaultLayoutTemplate_createdByMigration_isNotMarkedAsDefault(self):
        template = EmailTemplate.objects.get(name="Default-Tapir")

        self.assertEqual(EmailTemplateType.LAYOUT, template.template_type)
        self.assertFalse(template.is_default_layout)

    def test_defaultLayoutTemplate_seedFile_matchesStoredContent(self):
        template = EmailTemplate.objects.get(name="Default-Tapir")
        expected_content = Path(
            "tapir_mail/default_mail_content/default_layout.mjml"
        ).read_text(encoding="utf-8")

        self.assertEqual(expected_content, template.content)

    def test_defaultLayoutTemplate_seedFile_containsHeaderBodyMarkerDividerAndFooter(
        self,
    ):
        content = EmailTemplate.objects.get(name="Default-Tapir").content

        self.assertIn("Vereinsname", content)
        self.assertIn("<mj-divider", content)
        self.assertIn("Impressum", content)
        self.assertIn(f'css-class="{BODY_PLACEHOLDER_CSS_CLASS}"', content)
        self.assertRegex(content, r"\{\{\s*Body\s*\}\}")

    def test_applyLayout_defaultTapirTemplate_replacesMarkerWithEmailBody(self):
        template = EmailTemplate.objects.get(name="Default-Tapir")
        email_content = (
            "<mjml><mj-body>"
            "<mj-section><mj-column><mj-text>MAIL BODY</mj-text></mj-column></mj-section>"
            "</mj-body></mjml>"
        )

        result = apply_layout(email_content, template.content)

        self.assertIn("Vereinsname", result)
        self.assertIn("MAIL BODY", result)
        self.assertIn("Impressum", result)
        self.assertNotRegex(result, r"\{\{\s*Body\s*\}\}")
        self.assertNotIn(BODY_PLACEHOLDER_CSS_CLASS, result)
