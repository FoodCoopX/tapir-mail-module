from tapir_mail.models import EmailTemplate, EmailTemplateType
from tapir_mail.tests.factories import EmailTemplateFactory
from tapir_mail.tests.test_utils import TapirIntegrationTest


class EmailTemplateLayoutTest(TapirIntegrationTest):
    BODY_TOKEN = "{{Body}}"
    CONTENT = f"<mjml><mj-body>{BODY_TOKEN}</mj-body></mjml>"

    def test_createLayoutTemplateWithBodyToken_isSaved(self):
        response = self._create(
            {
                "name": "My layout",
                "content": self.CONTENT,
                "template_type": EmailTemplateType.LAYOUT,
            }
        )

        self.assertStatusCode(response, 201)
        template = EmailTemplate.objects.get()
        self.assertEqual(EmailTemplateType.LAYOUT, template.template_type)

    def test_createLayoutTemplateWithoutBodyToken_returns400(self):
        response = self._create(
            {
                "name": "My layout",
                "content": "<mjml><mj-body></mj-body></mjml>",
                "template_type": EmailTemplateType.LAYOUT,
            }
        )

        self.assertStatusCode(response, 400)
        self.assertEqual(0, EmailTemplate.objects.count())

    def test_createStartTemplateWithDefaultLayout_returns400(self):
        response = self._create(
            {
                "name": "My template",
                "content": "<mjml><mj-body></mj-body></mjml>",
                "template_type": EmailTemplateType.START,
                "is_default_layout": True,
            }
        )

        self.assertStatusCode(response, 400)
        self.assertEqual(0, EmailTemplate.objects.count())

    def test_markingSecondLayoutAsDefault_unsetsTheFirst(self):
        first = EmailTemplateFactory.create(
            template_type=EmailTemplateType.LAYOUT,
            content=self.CONTENT,
            is_default_layout=True,
        )

        response = self._create(
            {
                "name": "Second layout",
                "content": self.CONTENT,
                "template_type": EmailTemplateType.LAYOUT,
                "is_default_layout": True,
            }
        )

        self.assertStatusCode(response, 201)
        self.assertEqual(
            1, EmailTemplate.objects.filter(is_default_layout=True).count()
        )
        first.refresh_from_db()
        self.assertFalse(first.is_default_layout)

    def _create(self, post_data: dict):
        return self.apiClient.post(
            "/api/email_template/",
            data=post_data,
            format="json",
        )
