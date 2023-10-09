from django.forms import Form
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView

from tapir_mail_server.dummy_accounts.models import DummyTapirUser
from tapir_mail_server.dummy_accounts.triggers import (
    OnAccountCreatedTrigger,
    OnAccountUpdatedTrigger,
)


class DummyTapirUserListView(ListView):
    model = DummyTapirUser
    template_name = "dummy_accounts/dummytapiruser_list.html"


class DummyTapirUserCreateView(CreateView):
    model = DummyTapirUser
    template_name = "dummy_accounts/dummytapiruser_create.html"
    fields = ["email"]
    success_url = reverse_lazy("dummy_tapir_user_list_view")

    def form_valid(self, form: Form):
        OnAccountCreatedTrigger.fire(form.data["email"])
        return super().form_valid(form)


class DummyTapirUserUpdateView(UpdateView):
    model = DummyTapirUser
    template_name = "dummy_accounts/dummytapiruser_create.html"
    fields = ["email"]
    success_url = reverse_lazy("dummy_tapir_user_list_view")

    def form_valid(self, form):
        OnAccountUpdatedTrigger.fire(form.data["email"])
        return super().form_valid(form)
