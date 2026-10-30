from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("tapir_mail", "0050_emailtemplate_layout_type"),
    ]

    operations = [
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
    ]
