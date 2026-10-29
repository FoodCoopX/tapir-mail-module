from django.urls import reverse

from tapir_mail.models import StaticSegment, StaticSegmentRecipient
from tapir_mail.registries import mail_segment_providers, MailSegment
from tapir_mail.tests.factories import MailCategoryFactory
from tapir_mail.tests.test_utils import TapirIntegrationTest
from tapir_mail_server.dummy_accounts.models import DummyTapirUser


class TestAvailableSegments(TapirIntegrationTest):
    def setUp(self) -> None:
        super().setUp()
        self.provider = lambda: {
            "Segment with metadata": MailSegment(
                get_queryset=DummyTapirUser.objects.all,
                label="Short label",
                description="Some description",
                group="Some group",
            ),
        }
        mail_segment_providers.add(self.provider)

    def get_segments_by_id(self):
        response = self.apiClient.get(reverse("segment-available-segments"))
        self.assertStatusCode(response, 200)
        return {segment["id"]: segment for segment in response.json()["segments"]}

    def test_availableSegments_dynamicSegmentWithMetadata_returnsMetadata(self):
        segment = self.get_segments_by_id()["Segment with metadata"]

        self.assertEqual(
            {
                "id": "Segment with metadata",
                "type": "dynamic",
                "label": "Short label",
                "group": "Some group",
                "description": "Some description",
            },
            segment,
        )

    def test_availableSegments_staticSegmentWithSeveralRecipients_returnedOnce(self):
        static_segment = StaticSegment.objects.create(name="Static")
        for email in ["a@example.com", "b@example.com"]:
            StaticSegmentRecipient.objects.create(segment=static_segment, email=email)

        segments = self.apiClient.get(reverse("segment-available-segments")).json()[
            "segments"
        ]

        static_entries = [
            segment for segment in segments if segment["id"] == static_segment.id
        ]
        self.assertEqual(1, len(static_entries))
        self.assertEqual("static", static_entries[0]["type"])
        self.assertEqual("Static", static_entries[0]["label"])

    def test_availableSegments_mailCategory_returnedAsCategory(self):
        category = MailCategoryFactory.create(name="Newsletter")

        segment = self.get_segments_by_id()[category.id]

        self.assertEqual("category", segment["type"])
        self.assertEqual("Newsletter", segment["label"])
        self.assertEqual("Kategorien", segment["group"])
