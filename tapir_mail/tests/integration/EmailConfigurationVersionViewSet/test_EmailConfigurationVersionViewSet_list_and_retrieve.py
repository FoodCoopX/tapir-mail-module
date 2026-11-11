from tapir_mail.tests.factories import EmailConfigurationVersionFactory
from tapir_mail.tests.test_utils import TapirIntegrationTest


class TestEmailConfigurationVersionListAndRetrieve(TapirIntegrationTest):
    def test_list_returns405(self):
        EmailConfigurationVersionFactory.create()
        response = self.apiClient.get("/api/email_configuration_version/")
        self.assertEqual(405, response.status_code)

    def test_retrieve_returns405(self):
        version = EmailConfigurationVersionFactory.create()
        response = self.apiClient.get(f"/api/email_configuration_version/{version.id}/")
        self.assertEqual(405, response.status_code)

    def test_getBundledInfo_stillWorks(self):
        version = EmailConfigurationVersionFactory.create()
        response = self.apiClient.get(
            f"/api/email_configuration_version/{version.id}/get_bundled_info/"
        )
        self.assertEqual(200, response.status_code)
