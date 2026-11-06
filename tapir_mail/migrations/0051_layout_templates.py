from pathlib import Path

import django.db.models.deletion
from django.db import migrations, models
from django.db.models import Q

DEFAULT_LAYOUT_NAME = "Default-Tapir"
LEGACY_DEFAULT_LAYOUT_NAME = "Standard-Layout"
DEFAULT_LAYOUT_PATH = (
    Path(__file__).resolve().parent.parent
    / "default_mail_content"
    / "default_layout.mjml"
)


def seed_default_tapir(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    EmailTemplate = apps.get_model("tapir_mail", "EmailTemplate")
    EmailConfigurationVersion = apps.get_model(
        "tapir_mail", "EmailConfigurationVersion"
    )

    templates = EmailTemplate.objects.using(db_alias)
    versions = EmailConfigurationVersion.objects.using(db_alias)

    template = templates.filter(name=DEFAULT_LAYOUT_NAME).first()
    if template is None:
        legacy_template = templates.filter(name=LEGACY_DEFAULT_LAYOUT_NAME).first()
        if legacy_template is not None:
            legacy_template.name = DEFAULT_LAYOUT_NAME
            legacy_template.template_type = "layout"
            legacy_template.is_default_layout = False
            legacy_template.save(
                using=db_alias,
                update_fields=["name", "template_type", "is_default_layout"],
            )
            template = legacy_template
        else:
            template = templates.create(
                name=DEFAULT_LAYOUT_NAME,
                content=DEFAULT_LAYOUT_PATH.read_text(encoding="utf-8"),
                template_type="layout",
                is_default_layout=False,
            )

    if template.template_type != "layout" or template.is_default_layout:
        template.template_type = "layout"
        template.is_default_layout = False
        template.save(
            using=db_alias,
            update_fields=["template_type", "is_default_layout"],
        )

    # Existing mails keep their previous behaviour and must opt in manually.
    versions.update(layout_enabled=False, layout_template=None)


class Migration(migrations.Migration):

    dependencies = [
        ("tapir_mail", "0050_email_dispatch_indexes"),
    ]

    operations = [
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
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="versions_using_layout",
                to="tapir_mail.emailtemplate",
            ),
        ),
        migrations.AddField(
            model_name="emailconfigurationversion",
            name="layout_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(seed_default_tapir, migrations.RunPython.noop),
    ]
