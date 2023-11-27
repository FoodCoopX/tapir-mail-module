from functools import partial

from django.db import models, transaction
from django.utils import timezone
from nanoid import generate

from tapir_mail.service.segment import resolve_segments

ID_LENGTH = 10


def generate_id():
    return generate(size=ID_LENGTH)


class BaseModel(models.Model):
    """
    Provides a base model for all models in the project. This model is abstract and should not be used directly.
    """

    id = models.CharField(
        "ID",
        max_length=ID_LENGTH,
        unique=True,
        primary_key=True,
        default=partial(generate_id),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class EmailTemplate(BaseModel):
    """
    This represents the email content that is referenced by the EmailConfiguration.
    """

    name = models.CharField(max_length=255, unique=True)
    content = models.TextField()

    def __str__(self):
        return self.name


class EmailConfiguration(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)


class ReleaseStatus:
    DRAFT = "draft"
    RELEASED = "released"
    ARCHIVED = "archived"
    ERROR = "error"


RELEASE_STATUS_CHOICES = [
    (ReleaseStatus.DRAFT, "Draft"),
    (ReleaseStatus.RELEASED, "Released"),
    (ReleaseStatus.ARCHIVED, "Archived"),
    (ReleaseStatus.ERROR, "Error"),
]


class EmailConfigurationVersion(BaseModel):
    """
    This represents the configuration for an email that will be sent to a user or segment.
    """

    content = models.TextField(null=True)
    subject = models.CharField(max_length=255, null=True, blank=True)
    email_configuration = models.ForeignKey(
        EmailConfiguration, on_delete=models.CASCADE, related_name="versions"
    )
    status = models.CharField(
        max_length=255,
        choices=RELEASE_STATUS_CHOICES,
        default=ReleaseStatus.DRAFT,
    )
    # See TriggerSerializationMixin for the expected content of this field
    triggers = models.JSONField(null=True, blank=True)
    # See SegmentDataSerializer for the expected content of this field
    segment_data = models.JSONField(null=True, blank=True)

    @transaction.atomic
    def release(self):
        self.status = ReleaseStatus.RELEASED
        self.save()

        # Archive current released version
        for version in self.email_configuration.versions.exclude(id=self.id).filter(
            status=ReleaseStatus.RELEASED
        ):
            version.archive()

    def archive(self):
        self.status = ReleaseStatus.ARCHIVED
        self.save()

    def __str__(self):
        return f"{self.email_configuration.name} ({self.status}) ({self.updated_at})"


class EmailConfigurationDispatch(BaseModel):
    """
    This represents an email that has been scheduled to be sent to a list of recipients.
    """

    email_configuration_version = models.ForeignKey(
        EmailConfigurationVersion, on_delete=models.CASCADE
    )
    scheduled_time = models.DateTimeField(default=timezone.now)
    is_sent = models.BooleanField(default=False)
    override_recipients = models.JSONField(null=True)

    def get_recipient_list(self) -> list:
        if self.is_sent:
            return [dispatch.recipient for dispatch in self.emaildispatch_set.all()]

        if self.email_configuration_version.segment_data is not None:
            return resolve_segments(
                **self.email_configuration_version.segment_data,
                override_recipients=self.override_recipients,
            )

        return []

    def __str__(self):
        return f"{self.email_configuration_version} - {self.get_recipient_list()} - {self.scheduled_time} - {self.is_sent}"


def delete_unsent_dispatches_if_not_released(
    instance: EmailConfigurationVersion, **kwargs
):
    if instance.status == ReleaseStatus.RELEASED:
        return

    EmailConfigurationDispatch.objects.filter(
        email_configuration_version=instance, is_sent=False
    ).delete()


models.signals.post_save.connect(
    delete_unsent_dispatches_if_not_released, sender=EmailConfigurationVersion
)


class EmailDispatch(BaseModel):
    """
    This represents an email that has been sent to a single recipient.
    Here we can track bounces, errors, opening, etc.
    """

    class BounceTypes(models.TextChoices):
        SOFT = "soft", "Soft"
        HARD = "hard", "Hard"
        UNKNOWN = "unknown", "Unknown"
        NOT_ANALYZED = "not_analyzed", "Not analyzed"

    class DispatchStatus(models.TextChoices):
        ERROR = "error", "Fehler beim Versand"
        BOUNCED = "bounced", "Bounce"
        OPENED = "opened", "Geöffnet"
        UNKNOWN = "unknown", "Nicht geöffnet"

    email_configuration_dispatch = models.ForeignKey(
        EmailConfigurationDispatch, on_delete=models.CASCADE
    )
    recipient = models.EmailField()
    recipient_tokens = models.JSONField(null=True)
    sent_time = models.DateTimeField(null=True, blank=True)
    opened_time = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    bounce_message = models.TextField(null=True, blank=True)
    bounce_type = models.CharField(
        max_length=16,
        choices=BounceTypes.choices,
        default=BounceTypes.NOT_ANALYZED,
    )
    next_retry = models.OneToOneField(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="previous_retry",
    )

    def get_previous_retries(self):
        retries = []
        current_dispatch = getattr(self, "previous_retry", None)
        while current_dispatch is not None:
            retries.append(current_dispatch)
            current_dispatch = getattr(current_dispatch, "previous_retry", None)
        return list(reversed(retries))

    def __str__(self):
        return (
            f"{self.email_configuration_dispatch} - {self.recipient} - {self.sent_time}"
        )

    def get_dispatch_status(self):
        if self.error_message:
            return self.DispatchStatus.ERROR
        if self.bounce_message:
            return self.DispatchStatus.BOUNCED
        if self.opened_time:
            return self.DispatchStatus.OPENED
        return self.DispatchStatus.UNKNOWN


class StaticSegment(BaseModel):
    name = models.CharField(max_length=255, unique=True)


class StaticSegmentRecipient(BaseModel):
    segment = models.ForeignKey(
        StaticSegment, related_name="recipients", on_delete=models.CASCADE
    )
    first_name = models.CharField(max_length=255, null=True)
    last_name = models.CharField(max_length=255, null=True)
    email = models.EmailField()
    custom_data = models.JSONField(null=True)  # For additional fields, tokens etc.

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"
