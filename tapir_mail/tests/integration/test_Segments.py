from tapir_mail.models import StaticSegment, StaticSegmentRecipient
from tapir_mail.service.segment import (
    combine_segments_with_filters,
    register_filter,
    register_segment,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest
from tapir_mail_server.dummy_accounts.models import DummyTapirUser


class TestSegments(TapirIntegrationTest):
    SEGMENT_ALL_USERS = "Alle Benutzer"
    SEGMENT_COOP_MEMBERS = "Geno-Mitglieder"
    SEGMENT_NOT_COOP_MEMBERS = "Nicht Geno-Mitglied"

    STATIC_SEGMENT = "Static1"
    STATIC_RECIPIENT_1 = "static1@example.com"
    STATIC_RECIPIENT_2 = "static2@example.com"

    FILTER_HAS_COOP_SHARES = "has_coop_shares"

    @classmethod
    def setUpTestData(cls):
        # Create some dummy users with and without coop shares
        DummyTapirUser.objects.create(id=1, has_coop_shares=True)
        DummyTapirUser.objects.create(id=2, has_coop_shares=False)
        DummyTapirUser.objects.create(id=3, has_coop_shares=True)
        DummyTapirUser.objects.create(id=4, has_coop_shares=False)

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
        static_segment = StaticSegment.objects.create(name=cls.STATIC_SEGMENT)
        StaticSegmentRecipient.objects.create(
            segment=static_segment, email=cls.STATIC_RECIPIENT_1
        )
        StaticSegmentRecipient.objects.create(
            segment=static_segment, email=cls.STATIC_RECIPIENT_2
        )

        def has_coop_shares_filter(qs):
            return qs.filter(has_coop_shares=True)

        register_filter(cls.FILTER_HAS_COOP_SHARES, has_coop_shares_filter)

    def test_combineSegmentsWithFilters_addSegments_returnsCorrectList(self):
        result = combine_segments_with_filters(add_segments=[self.SEGMENT_ALL_USERS])
        self.assertSetEqual(set(r.id for r in result), {1, 2, 3, 4})

    def test_combineSegmentsWithFilters_addAndRemoveSegments_returnsCorrectList(self):
        result = combine_segments_with_filters(
            add_segments=[self.SEGMENT_ALL_USERS],
            remove_segments=[self.SEGMENT_NOT_COOP_MEMBERS],
        )
        self.assertSetEqual(set(r.id for r in result), {1, 3})

    def test_combineSegmentsWithFilters_addDynamicAndStaticSegments_returnsCorrectList(
        self,
    ):
        result = combine_segments_with_filters(
            add_segments=[self.SEGMENT_NOT_COOP_MEMBERS],
            static_segments=[self.STATIC_SEGMENT],
        )
        self.assertSetEqual(
            set(
                r.email if isinstance(r, StaticSegmentRecipient) else r.id
                for r in result
            ),
            {2, 4, self.STATIC_RECIPIENT_1, self.STATIC_RECIPIENT_2},
        )

    def test_combineSegmentsWithFilters_addSegmentWithFilter_returnsCorrectList(self):
        result = combine_segments_with_filters(
            add_segments=[self.SEGMENT_ALL_USERS],
            filter_list=[self.FILTER_HAS_COOP_SHARES],
        )
        self.assertSetEqual(set(r.id for r in result), {1, 3})

    def test_combineSegmentsWithFilters_addStaticSegment_returnsCorrectList(self):
        result = combine_segments_with_filters(static_segments=[self.STATIC_SEGMENT])
        self.assertSetEqual(
            set(r.email for r in result),
            {self.STATIC_RECIPIENT_1, self.STATIC_RECIPIENT_2},
        )
