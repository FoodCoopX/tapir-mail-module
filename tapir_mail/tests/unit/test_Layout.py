from tapir_mail.exceptions import TapirMailException
from tapir_mail.service.layout import (
    apply_layout,
    extract_mj_body_inner,
    layout_contains_body_token,
)
from tapir_mail.tests.test_utils import TapirUnitTest


class LayoutTest(TapirUnitTest):
    BODY = (
        "<mjml><mj-head></mj-head><mj-body>"
        "<mj-text>Hello</mj-text>"
        "</mj-body></mjml>"
    )
    LAYOUT = (
        "<mjml><mj-head></mj-head><mj-body>"
        "<mj-text>HEAD</mj-text>{{Body}}<mj-text>FOOT</mj-text>"
        "</mj-body></mjml>"
    )

    def test_extractMjBodyInner_returnsInnerContent(self):
        self.assertEqual("<mj-text>Hello</mj-text>", extract_mj_body_inner(self.BODY))

    def test_extractMjBodyInner_noBodyWrapper_returnsInputUnchanged(self):
        self.assertEqual(
            "<mj-text>Hello</mj-text>",
            extract_mj_body_inner("<mj-text>Hello</mj-text>"),
        )

    def test_applyLayout_replacesBodyPlaceholder(self):
        self.assertEqual(
            "<mjml><mj-head></mj-head><mj-body>"
            "<mj-text>HEAD</mj-text><mj-text>Hello</mj-text><mj-text>FOOT</mj-text>"
            "</mj-body></mjml>",
            apply_layout(self.BODY, self.LAYOUT),
        )

    def test_applyLayout_bodyWithoutWrapper_insertedAsIs(self):
        result = apply_layout("<mj-text>Hello</mj-text>", self.LAYOUT)
        self.assertIn("<mj-text>HEAD</mj-text>", result)
        self.assertIn("<mj-text>Hello</mj-text>", result)
        self.assertIn("<mj-text>FOOT</mj-text>", result)

    def test_applyLayout_layoutWithoutBodyToken_raises(self):
        with self.assertRaises(TapirMailException):
            apply_layout(self.BODY, "<mjml><mj-body></mj-body></mjml>")

    def test_layoutContainsBodyToken_toleratesWhitespace(self):
        self.assertTrue(layout_contains_body_token("{{Body}}"))
        self.assertTrue(layout_contains_body_token("{{ Body }}"))
        self.assertTrue(layout_contains_body_token("{{Body }}"))
        self.assertFalse(layout_contains_body_token("<mjml></mjml>"))
        self.assertFalse(layout_contains_body_token(""))
