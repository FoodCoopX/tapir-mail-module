from tapir_mail.models import (
    MailCategory,
    StaticSegmentRecipient,
    ExternalRecipient,
    ExternalRecipientConfirmation,
)


class ExternalRecipientManager:
    @staticmethod
    def is_email_address_registered_to_category(
        mail_category: MailCategory, email: str
    ):
        return StaticSegmentRecipient.objects.filter(
            segment_id=mail_category.static_segment_id,
            email=email,
        ).exists()

    @classmethod
    def register_external_recipient_to_category(
        cls, mail_category: MailCategory, external_recipient: ExternalRecipient
    ):
        StaticSegmentRecipient.objects.get_or_create(
            segment_id=mail_category.static_segment_id,
            email=external_recipient.email,
            defaults={"first_name": external_recipient.first_name},
        )

    @classmethod
    def remove_external_recipient_from_category(
        cls, mail_category: MailCategory, external_recipient: ExternalRecipient
    ):
        StaticSegmentRecipient.objects.filter(
            segment_id=mail_category.static_segment_id,
            email=external_recipient.email,
        ).delete()
        ExternalRecipientConfirmation.objects.filter(
            mail_category=mail_category, external_recipient=external_recipient
        ).delete()
