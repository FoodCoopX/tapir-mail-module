from pathlib import Path

from django.db import migrations, models
from django.db.models import Q
from django.db.models.deletion import SET_NULL

DEFAULT_LAYOUT_NAME = "Default-Tapir"
LEGACY_DEFAULT_LAYOUT_NAME = "Standard-Layout"

SUPERSEDED_MIGRATIONS = [
    "0050_emailtemplate_layout_type",
    "0051_emailconfigurationversion_layout",
    "0052_merge_layout_templates_and_indexes",
    "0053_default_layout_template",
    "0055_disable_automatic_layouts",
]

SCHEMA_SQL = """
ALTER TABLE tapir_mail_emailtemplate
    ADD COLUMN IF NOT EXISTS template_type varchar(16) NOT NULL DEFAULT 'start';

ALTER TABLE tapir_mail_emailtemplate
    ADD COLUMN IF NOT EXISTS is_default_layout boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS unique_default_layout_template
    ON tapir_mail_emailtemplate (is_default_layout)
    WHERE is_default_layout;

ALTER TABLE tapir_mail_emailconfigurationversion
    ADD COLUMN IF NOT EXISTS layout_template_id varchar(10) NULL;

ALTER TABLE tapir_mail_emailconfigurationversion
    ADD COLUMN IF NOT EXISTS layout_enabled boolean NOT NULL DEFAULT false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = ANY (c.conkey)
        WHERE c.contype = 'f'
          AND c.conrelid = 'tapir_mail_emailconfigurationversion'::regclass
          AND a.attname = 'layout_template_id'
    ) THEN
        ALTER TABLE tapir_mail_emailconfigurationversion
            ADD CONSTRAINT tapir_mail_emailconfigurationversion_layout_template_id_fk
            FOREIGN KEY (layout_template_id)
            REFERENCES tapir_mail_emailtemplate (id)
            ON DELETE SET NULL;
    END IF;
END
$$;
"""


def seed_default_tapir(apps, schema_editor):
    EmailTemplate = apps.get_model("tapir_mail", "EmailTemplate")
    EmailConfigurationVersion = apps.get_model(
        "tapir_mail", "EmailConfigurationVersion"
    )

    content = (
        Path(__file__).resolve().parent.parent
        / "default_mail_content"
        / "default_layout.mjml"
    ).read_text(encoding="utf-8")

    template = EmailTemplate.objects.filter(name=DEFAULT_LAYOUT_NAME).first()
    legacy_template = EmailTemplate.objects.filter(
        name=LEGACY_DEFAULT_LAYOUT_NAME
    ).first()

    if template is None and legacy_template is not None:
        legacy_template.name = DEFAULT_LAYOUT_NAME
        legacy_template.template_type = "layout"
        legacy_template.is_default_layout = False
        legacy_template.save(
            update_fields=["name", "template_type", "is_default_layout"]
        )
        template = legacy_template

    if template is None:
        EmailTemplate.objects.create(
            name=DEFAULT_LAYOUT_NAME,
            content=content,
            template_type="layout",
            is_default_layout=False,
        )
    elif template.template_type != "layout" or template.is_default_layout:
        template.template_type = "layout"
        template.is_default_layout = False
        template.save(update_fields=["template_type", "is_default_layout"])

    # Existing mails keep their previous behaviour and must opt in manually.
    EmailConfigurationVersion.objects.update(
        layout_enabled=False,
        layout_template=None,
    )


def remove_superseded_migration_records(apps, schema_editor):
    from django.db.migrations.recorder import MigrationRecorder

    MigrationRecorder.Migration.objects.filter(
        app="tapir_mail",
        name__in=SUPERSEDED_MIGRATIONS,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tapir_mail", "0050_email_dispatch_indexes"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=SCHEMA_SQL,
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="emailtemplate",
                    name="template_type",
                    field=models.CharField(
                        choices=[
                            ("start", "Start-Vorlage"),
                            ("layout", "Layout-Vorlage"),
                        ],
                        default="start",
                        max_length=16,
                    ),
                ),
                migrations.AddField(
                    model_name="emailtemplate",
                    name="is_default_layout",
                    field=models.BooleanField(default=False),
                ),
                migrations.AddConstraint(
                    model_name="emailtemplate",
                    constraint=models.UniqueConstraint(
                        condition=Q(is_default_layout=True),
                        fields=("is_default_layout",),
                        name="unique_default_layout_template",
                    ),
                ),
                migrations.AddField(
                    model_name="emailconfigurationversion",
                    name="layout_template",
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=SET_NULL,
                        related_name="versions_using_layout",
                        to="tapir_mail.emailtemplate",
                    ),
                ),
                migrations.AddField(
                    model_name="emailconfigurationversion",
                    name="layout_enabled",
                    field=models.BooleanField(default=False),
                ),
            ],
        ),
        migrations.RunPython(seed_default_tapir, migrations.RunPython.noop),
        migrations.RunPython(
            remove_superseded_migration_records, migrations.RunPython.noop
        ),
    ]
