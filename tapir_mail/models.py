from functools import partial

from django.db import models, transaction
from nanoid import generate

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
    recipients = models.TextField(null=True, blank=True)


class ReleaseStatus:
    DRAFT = "draft"
    RELEASED = "released"
    ARCHIVED = "archived"


RELEASE_STATUS_CHOICES = [
    (ReleaseStatus.DRAFT, "Draft"),
    (ReleaseStatus.RELEASED, "Released"),
    (ReleaseStatus.ARCHIVED, "Archived"),
]


class EmailConfigurationVersion(BaseModel):
    """
    This represents the configuration for an email that will be sent to a user or segment.
    """

    content = models.TextField(null=True)
    subject = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, null=True, blank=True)
    email_configuration = models.ForeignKey(
        EmailConfiguration, on_delete=models.CASCADE, related_name="versions"
    )
    status = models.CharField(
        max_length=255,
        choices=RELEASE_STATUS_CHOICES,
        default=ReleaseStatus.DRAFT,
    )

    @transaction.atomic
    def release(self):
        self.status = ReleaseStatus.RELEASED
        self.save()

        # Archive current released version
        self.email_configuration.versions.exclude(id=self.id).filter(
            status=ReleaseStatus.RELEASED
        ).update(status=ReleaseStatus.ARCHIVED)

    def archive(self):
        self.status = ReleaseStatus.ARCHIVED
        self.save()

    def __str__(self):
        return self.name
