from tapir_mail.models import (
    EmailConfigurationVersion,
    ReleaseStatus,
    EmailConfigurationDispatch,
)
from tapir_mail.service.segment import register_segment
from tapir_mail.tests.factories import (
    EmailConfigurationVersionFactory,
    EmailConfigurationDispatchFactory,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest, build_time_trigger_dict
from tapir_mail_server.dummy_accounts.models import DummyTapirUser


class TestEmailConfigurationVersionViewSetUpdate(TapirIntegrationTest):
    TEST_SEGMENT = "Test segment"

    def test_invalidData_returns400(self):
        version = EmailConfigurationVersionFactory.create()
        response = self._send_request(version.id, {"invalid_parameter": "aaa"})

        self.assertStatusCode(response, 400)

    def test_default_emailConfigurationVersionGetsUpdated(self):
        def test_segment():
            return DummyTapirUser.objects.all()

        register_segment(self.TEST_SEGMENT, test_segment)

        segment_data_before = {
            "add_segments": [self.TEST_SEGMENT],
            "static_segments": [],
            "static_segments_subtractive": [],
            "remove_segments": [],
            "filter_list": [],
        }
        version: EmailConfigurationVersion = EmailConfigurationVersionFactory.create(
            email_configuration__name="Name before",
            email_configuration__description="Description before",
            content="Content before",
            subject="Subject before",
            status="Status before",
            segment_data=segment_data_before,
            triggers=None,
        )

        segment_data_after = {
            "add_segments": [],
            "static_segments": [],
            "static_segments_subtractive": [],
            "remove_segments": [self.TEST_SEGMENT],
            "filter_list": [],
        }
        trigger = build_time_trigger_dict()
        put_data = {
            "name": "Name after",
            "description": "Description after",
            "content": "Content after",
            "subject": "Subject after",
            "release_status": "Status after",
            "triggers": [trigger],
            "segment_data": segment_data_after,
        }
        response = self._send_request(version.id, put_data)

        self.assertStatusCode(response, 200)
        version.refresh_from_db()
        self.assertEqual("Name after", version.email_configuration.name)
        self.assertEqual("Description after", version.email_configuration.description)
        self.assertEqual("Content after", version.content)
        self.assertEqual("Subject after", version.subject)
        self.assertEqual("Status after", version.status)
        self.assertEqual([trigger], version.triggers)
        self.assertEqual(
            segment_data_after,
            version.segment_data,
        )

    def test_creatingReleaseVersion_olderReleaseGetsArchived(self):
        older_release: EmailConfigurationVersion = (
            EmailConfigurationVersionFactory.create(status=ReleaseStatus.RELEASED)
        )
        new_version = EmailConfigurationVersionFactory.create(
            email_configuration=older_release.email_configuration,
            status=ReleaseStatus.DRAFT,
        )
        put_data = {
            "name": older_release.email_configuration.name,
            "content": older_release.content,
            "release_status": ReleaseStatus.RELEASED,
        }
        response = self._send_request(new_version.id, put_data)

        self.assertStatusCode(response, 200)
        older_release.refresh_from_db()
        self.assertEqual(ReleaseStatus.ARCHIVED, older_release.status)

    def test_archiving_emailDispatchesGetDeleted(self):
        version: EmailConfigurationVersion = EmailConfigurationVersionFactory.create(
            status=ReleaseStatus.RELEASED
        )
        sent_dispatch = EmailConfigurationDispatchFactory.create(
            email_configuration_version=version, is_sent=True
        )
        EmailConfigurationDispatchFactory.create(
            email_configuration_version=version, is_sent=False
        )
        put_data = {
            "name": version.email_configuration.name,
            "content": version.content,
            "release_status": ReleaseStatus.ARCHIVED,
        }
        response = self._send_request(version.id, put_data)
        self.assertStatusCode(response, 200)
        version.refresh_from_db()
        self.assertEqual(ReleaseStatus.ARCHIVED, version.status)
        self.assertEqual(1, EmailConfigurationDispatch.objects.count())
        self.assertEqual(
            sent_dispatch.id, EmailConfigurationDispatch.objects.first().id
        )

    def _send_request(self, email_configuration_version_id: str, put_data: dict | None):
        return self.apiClient.put(
            f"/api/email_configuration_version/{email_configuration_version_id}/",
            data=put_data,
            format="json",
        )
