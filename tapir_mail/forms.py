from django import forms
from django.core.exceptions import ValidationError
from django.forms.forms import Form

from tapir_mail.models import MailCategory


class RegisterToMailCategoryForm(Form):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(required=True)

    def __init__(self, *args, **kwargs):
        self.category = MailCategory.objects.get(id=kwargs.pop("category_id"))
        super().__init__(*args, **kwargs)

    def clean_email(
        self,
    ):
        if self.category.static_segment.recipients.filter(
            email=self.cleaned_data["email"]
        ).exists():
            raise ValidationError(
                "Diese Mail-Adresse ist schon für dieser Newsletter eingetragen"
            )
        return self.cleaned_data["email"]
