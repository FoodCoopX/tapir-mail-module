from tapir_mail.models import EmailConfigurationDispatch
from tapir_mail.service.segment import resolve_segments


class EmailConfigurationDispatchRecipientListProvider:
    @staticmethod
    def get_recipient_list(
        email_configuration_dispatch: EmailConfigurationDispatch,
    ) -> list:
        if email_configuration_dispatch.is_sent:
            return [
                dispatch.recipient
                for dispatch in email_configuration_dispatch.emaildispatch_set.all()
            ]

        if (
            email_configuration_dispatch.email_configuration_version.segment_data
            is not None
        ):
            return resolve_segments(
                **email_configuration_dispatch.email_configuration_version.segment_data,
                override_recipients=email_configuration_dispatch.override_recipients,
            )

        return []
