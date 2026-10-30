from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tapir_mail", "0049_emaildispatch_not_before_is_automatic_retry"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailtemplate",
            name="template_type",
            field=models.CharField(
                choices=[("start", "Start-Vorlage"), ("layout", "Layout-Vorlage")],
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
                condition=models.Q(("is_default_layout", True)),
                fields=("is_default_layout",),
                name="unique_default_layout_template",
            ),
        ),
    ]
