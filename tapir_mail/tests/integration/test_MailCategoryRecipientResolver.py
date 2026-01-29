from tapir_mail.models import MailCategoryMode, InternalRecipientCategoryRegistration
from tapir_mail.service.mail_category_recipients_resolver import (
    MailCategoryRecipientResolver,
)
from tapir_mail.service.segment import register_segment
from tapir_mail.tests.factories import (
    MailCategoryFactory,
    StaticSegmentRecipientFactory,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest
from tapir_mail_server.dummy_accounts.models import DummyTapirUser
from tapir_mail_server.dummy_accounts.tests.factories import (
    DummyTapirUserFactory,
    DummyPickupLocationFactory,
)


class TestMailCategoryRecipientResolver(TapirIntegrationTest):
    @classmethod
    def setUpTestData(cls):
        DummyPickupLocationFactory.create()

    def test_resolveRecipients_noDynamicSegment_returnsStaticRecipientsOnly(self):
        mail_category = MailCategoryFactory.create(dynamic_segment_name="")
        external_recipient = StaticSegmentRecipientFactory.create(
            segment=mail_category.static_segment
        )
        DummyTapirUserFactory.create()

        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )

        self.assertEqual([external_recipient], result)

    def test_resolveRecipients_hasDynamicSegment_returnsStaticAndDynamicRecipients(
        self,
    ):
        mail_category = MailCategoryFactory.create(
            dynamic_segment_name="test_segment", mode=MailCategoryMode.ALWAYS_ON
        )
        external_recipient = StaticSegmentRecipientFactory.create(
            segment=mail_category.static_segment
        )
        register_segment("test_segment", lambda: DummyTapirUser.objects.all())
        internal_recipient = DummyTapirUserFactory.create()

        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )

        self.assertEqual({internal_recipient, external_recipient}, set(result))

    def test_resolveRecipients_modeIsAlwaysOn_userIsAlwaysIncluded(
        self,
    ):
        mail_category = MailCategoryFactory.create(
            dynamic_segment_name="test_segment", mode=MailCategoryMode.ALWAYS_ON
        )
        register_segment("test_segment", lambda: DummyTapirUser.objects.all())
        internal_recipient = DummyTapirUserFactory.create()

        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([internal_recipient], result)

        InternalRecipientCategoryRegistration.objects.create(
            internal_recipient_id=internal_recipient.id,
            mail_category=mail_category,
            is_registered=True,
        )
        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([internal_recipient], result)

        InternalRecipientCategoryRegistration.objects.update(is_registered=False)
        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([internal_recipient], result)

    def test_resolveRecipients_modeIsDefaultOn_userOnlyExcludedIfExplicitlyUnregistered(
        self,
    ):
        mail_category = MailCategoryFactory.create(
            dynamic_segment_name="test_segment",
            mode=MailCategoryMode.OPTIONAL_DEFAULT_ON,
        )
        register_segment("test_segment", lambda: DummyTapirUser.objects.all())
        internal_recipient = DummyTapirUserFactory.create()

        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([internal_recipient], result)

        InternalRecipientCategoryRegistration.objects.create(
            internal_recipient_id=internal_recipient.id,
            mail_category=mail_category,
            is_registered=True,
        )
        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([internal_recipient], result)

        InternalRecipientCategoryRegistration.objects.update(is_registered=False)
        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([], result)

    def test_resolveRecipients_modeIsDefaultOff_userOnlyIncludedIfExplicitlyRegistered(
        self,
    ):
        mail_category = MailCategoryFactory.create(
            dynamic_segment_name="test_segment",
            mode=MailCategoryMode.OPTIONAL_DEFAULT_OFF,
        )
        register_segment("test_segment", lambda: DummyTapirUser.objects.all())
        internal_recipient = DummyTapirUserFactory.create()

        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([], result)

        InternalRecipientCategoryRegistration.objects.create(
            internal_recipient_id=internal_recipient.id,
            mail_category=mail_category,
            is_registered=True,
        )
        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([internal_recipient], result)

        InternalRecipientCategoryRegistration.objects.update(is_registered=False)
        result = MailCategoryRecipientResolver.resolve_recipients(
            mail_category=mail_category
        )
        self.assertEqual([], result)
