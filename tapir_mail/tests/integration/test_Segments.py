from tapir_mail.models import StaticSegment, StaticSegmentRecipient
from tapir_mail.service.segment import (
    resolve_segments,
    register_filter,
    register_segment,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest
from tapir_mail.triggers.transactional_trigger import TransactionalTriggerData
from tapir_mail_server.dummy_accounts.models import DummyTapirUser
from tapir_mail_server.dummy_accounts.tests.factories import (
    DummyTapirUserFactory,
    DummyPickupLocationFactory,
)


class TestSegments(TapirIntegrationTest):
    SEGMENT_ALL_USERS = "Alle Benutzer"
    SEGMENT_COOP_MEMBERS = "Geno-Mitglieder"
    SEGMENT_NOT_COOP_MEMBERS = "Nicht Geno-Mitglied"

    STATIC_RECIPIENT_1 = "static1@example.com"
    STATIC_RECIPIENT_2 = "static2@example.com"

    FILTER_HAS_COOP_SHARES = "has_coop_shares"

    @classmethod
    def setUpTestData(cls):
        # Create some dummy users with and without coop shares
        DummyPickupLocationFactory.create()
        DummyTapirUserFactory.create(id=1, has_coop_shares=True, email="mail1@test.net")
        DummyTapirUserFactory.create(
            id=2, has_coop_shares=False, email="mail2@test.net"
        )
        DummyTapirUserFactory.create(id=3, has_coop_shares=True, email="mail3@test.net")
        DummyTapirUserFactory.create(
            id=4, has_coop_shares=False, email="mail4@test.net"
        )

        def coop_members():
            return DummyTapirUser.objects.filter(has_coop_shares=True)

        def not_coop_members():
            return DummyTapirUser.objects.filter(has_coop_shares=False)

        def all_users():
            return DummyTapirUser.objects.all()

        register_segment(cls.SEGMENT_ALL_USERS, all_users)
        register_segment(cls.SEGMENT_COOP_MEMBERS, coop_members)
        register_segment(cls.SEGMENT_NOT_COOP_MEMBERS, not_coop_members)

        # Create a static segment
        cls.static_segment = StaticSegment.objects.create(name="Static1")
        StaticSegmentRecipient.objects.create(
            segment=cls.static_segment, email=cls.STATIC_RECIPIENT_1
        )
        StaticSegmentRecipient.objects.create(
            segment=cls.static_segment, email=cls.STATIC_RECIPIENT_2
        )

        def has_coop_shares_filter(qs):
            return qs.filter(has_coop_shares=True)

        register_filter(cls.FILTER_HAS_COOP_SHARES, has_coop_shares_filter)

    def test_combineSegmentsWithFilters_addSegments_returnsCorrectList(self):
        result = resolve_segments(
            dynamic_segment_names_additive=[self.SEGMENT_ALL_USERS]
        )
        self.assertSetEqual({r.id for r in result}, {1, 2, 3, 4})

    def test_combineSegmentsWithFilters_addAndRemoveSegments_returnsCorrectList(self):
        result = resolve_segments(
            dynamic_segment_names_additive=[self.SEGMENT_ALL_USERS],
            dynamic_segment_names_subtractive=[self.SEGMENT_NOT_COOP_MEMBERS],
        )
        self.assertSetEqual({r.id for r in result}, {1, 3})

    def test_combineSegmentsWithFilters_addDynamicAndStaticSegments_returnsCorrectList(
        self,
    ):
        result = resolve_segments(
            dynamic_segment_names_additive=[self.SEGMENT_NOT_COOP_MEMBERS],
            static_segment_ids_additive=[self.static_segment.id],
        )
        self.assertSetEqual(
            {
                r.email if isinstance(r, StaticSegmentRecipient) else r.id
                for r in result
            },
            {2, 4, self.STATIC_RECIPIENT_1, self.STATIC_RECIPIENT_2},
        )

    def test_combineSegmentsWithFilters_addSegmentWithFilter_returnsCorrectList(self):
        result = resolve_segments(
            dynamic_segment_names_additive=[self.SEGMENT_ALL_USERS],
            filter_list=[self.FILTER_HAS_COOP_SHARES],
        )
        self.assertSetEqual({r.id for r in result}, {1, 3})

    def test_combineSegmentsWithFilters_addStaticSegment_returnsCorrectList(self):
        result = resolve_segments(static_segment_ids_additive=[self.static_segment.id])
        self.assertSetEqual(
            {r.email for r in result},
            {self.STATIC_RECIPIENT_1, self.STATIC_RECIPIENT_2},
        )

    def test_resolveSegments_includesSubtractiveStaticSegment_recipientFromSubtractiveSegmentNotInList(
        self,
    ):
        subtractive_static_segment = StaticSegment.objects.create(name="subtractive")
        StaticSegmentRecipient.objects.create(
            segment=subtractive_static_segment,
            email=DummyTapirUser.objects.get(id=1).email,
        )

        result = resolve_segments(
            dynamic_segment_names_additive=[self.SEGMENT_COOP_MEMBERS],
            static_segment_ids_subtractive=[subtractive_static_segment.id],
        )
        self.assertSetEqual(
            {r.email for r in result},
            {DummyTapirUser.objects.get(id=3).email},
        )

    def test_resolveSegments_overrideRecipientByBaseQuerysetId_resultsContainOnlyRecipientWithEmailFromOverride(
        self,
    ):
        result = resolve_segments(
            dynamic_segment_names_additive=[self.SEGMENT_ALL_USERS],
            override_recipients=[
                {"recipient_id_in_base_queryset": 2},
                {"recipient_id_in_base_queryset": 4},
            ],
        )
        self.assertSetEqual({r.id for r in result}, {2, 4})

    def test_resolveSegments_recipientsOutsideTheBaseQueryset_resultContainsFirstGivenRecipient(
        self,
    ):
        result = resolve_segments(
            dynamic_segment_names_additive=[self.SEGMENT_ALL_USERS],
            override_recipients=[
                {
                    "recipient_outside_of_base_queryset": {
                        "email": "test@email.com",
                        "first_name": "Max",
                        "last_name": "Mustermann",
                    }
                }
            ],
        )
        self.assertEqual(1, len(result))
        self.assertEqual(
            TransactionalTriggerData.RecipientOutsideOfBaseQueryset(
                email="test@email.com",
                first_name="Max",
                last_name="Mustermann",
            ),
            result[0],
        )
