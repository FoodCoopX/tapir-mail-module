import datetime
import json

from tapir_mail.models import (
    EmailConfigurationVersion,
    ReleaseStatus,
    EmailConfiguration,
    EmailConfigurationDispatch,
)
from tapir_mail.service.shortcuts import make_timezone_aware
from tapir_mail.triggers.time_trigger import TimeTrigger
from tapir_mail.tests.factories import (
    EmailConfigurationFactory,
    EmailConfigurationVersionFactory,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest


class TestEmailConfigurationVersionViewSetCreate(TapirIntegrationTest):
    CONFIG_NAME = "Test name"
    VERSION_CONTENT = "Test content"
    VERSION_SUBJECT = "Test subject"

    def test_invalidData_returns400(self):
        response = self._send_request({"invalid_parameter": "aaa"})

        self.assertStatusCode(response, 400)
        self.assertEqual(0, EmailConfigurationVersion.objects.count())

    def test_emailConfigurationDoesntExist_emailConfigurationGetsCreated(self):
        response = self._send_request(self.get_minimal_post_data())

        self.assertStatusCode(response, 201)
        self.assertEqual(1, EmailConfiguration.objects.count())
        config = EmailConfiguration.objects.get()
        self.assertEqual(self.CONFIG_NAME, config.name)

    def test_emailConfigurationAlreadyExists_emailConfigurationGetsUpdated(self):
        EmailConfigurationFactory.create(
            name=self.CONFIG_NAME, description="Description before"
        )
        post_data = self.get_minimal_post_data()
        post_data["description"] = "Description after"
        response = self._send_request(post_data)

        self.assertStatusCode(response, 201)
        self.assertEqual(1, EmailConfiguration.objects.count())
        config = EmailConfiguration.objects.get()
        self.assertEqual(self.CONFIG_NAME, config.name)
        self.assertIn("Description after", config.description)

    def test_default_emailConfigurationVersionGetsCreated(self):
        config = EmailConfigurationFactory.create()
        scheduled_time = datetime.datetime(year=2021, month=1, day=1)
        post_data = {
            "name": config.name,
            "content": self.VERSION_CONTENT,
            "subject": self.VERSION_SUBJECT,
            "release_status": "Test status",
            "trigger": TimeTrigger.get_id(),
            "trigger_data": {"scheduled_time": scheduled_time.isoformat()},
            "segment_data": {
                "add_segments": [],
                "static_segments": [],
                "remove_segments": [],
                "filter_list": [],
            },
        }
        response = self._send_request(post_data)

        self.assertStatusCode(response, 201)
        self.assertEqual(1, EmailConfigurationVersion.objects.count())
        version = EmailConfigurationVersion.objects.get()
        self.assertEqual(self.VERSION_CONTENT, version.content)
        self.assertEqual(self.VERSION_SUBJECT, version.subject)
        self.assertEqual("Test status", version.status)
        self.assertEqual(TimeTrigger.get_id(), version.trigger)
        self.assertEqual(
            {"scheduled_time": scheduled_time.isoformat()}, version.trigger_data
        )
        self.assertEqual(
            {
                "add_segments": [],
                "static_segments": [],
                "remove_segments": [],
                "filter_list": [],
            },
            version.segment_data,
        )
        self.assertEqual({"id": version.id}, json.loads(response.content))

    def test_creatingDraftVersion_triggerNotExecuted(self):
        post_data = self.get_minimal_post_data()
        post_data["release_status"] = ReleaseStatus.DRAFT
        post_data["trigger"] = TimeTrigger.get_id()
        scheduled_time = datetime.datetime(year=2021, month=1, day=1)
        post_data["trigger_data"] = {"scheduled_time": scheduled_time.isoformat()}
        response = self._send_request(post_data)

        self.assertStatusCode(response, 201)
        self.assertFalse(EmailConfigurationDispatch.objects.exists())

    def test_creatingReleaseVersion_triggerExecuted(self):
        post_data = self.get_minimal_post_data()
        post_data["release_status"] = ReleaseStatus.RELEASED
        post_data["trigger"] = TimeTrigger.get_id()
        scheduled_time = make_timezone_aware(
            datetime.datetime(year=2021, month=1, day=1)
        )
        post_data["trigger_data"] = {"scheduled_time": scheduled_time.isoformat()}
        response = self._send_request(post_data)

        self.assertStatusCode(response, 201)
        self.assertEqual(1, EmailConfigurationDispatch.objects.count())
        config_dispatch = EmailConfigurationDispatch.objects.get()
        self.assertEqual(scheduled_time, config_dispatch.scheduled_time)

    def test_creatingReleaseVersion_olderReleaseGetsArchived(self):
        older_release: EmailConfigurationVersion = (
            EmailConfigurationVersionFactory.create(status=ReleaseStatus.RELEASED)
        )
        post_data = self.get_minimal_post_data()
        post_data["name"] = older_release.email_configuration.name
        post_data["release_status"] = ReleaseStatus.RELEASED
        response = self._send_request(post_data)

        self.assertStatusCode(response, 201)
        older_release.refresh_from_db()
        self.assertEqual(ReleaseStatus.ARCHIVED, older_release.status)

    def get_minimal_post_data(self):
        return {
            "name": self.CONFIG_NAME,
            "content": self.VERSION_CONTENT,
            "release_status": ReleaseStatus.DRAFT,
        }

    def _send_request(self, post_data: dict | None):
        return self.apiClient.post(
            "/api/email_configuration_version/",
            data=post_data,
            format="json",
        )
