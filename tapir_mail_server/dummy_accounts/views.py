from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView

from tapir_mail.service.triggers import fire_trigger
from tapir_mail_server.dummy_accounts.apps import (
    TRIGGER_NAME_ON_DUMMY_ACCOUNT_CREATED,
    TRIGGER_NAME_ON_DUMMY_ACCOUNT_UPDATED,
)
from tapir_mail_server.dummy_accounts.models import DummyTapirUser


class DummyTapirUserListView(ListView):
    model = DummyTapirUser
    template_name = "dummy_accounts/dummytapiruser_list.html"


class DummyTapirUserCreateView(CreateView):
    model = DummyTapirUser
    template_name = "dummy_accounts/dummytapiruser_create.html"
    fields = ["email"]
    success_url = reverse_lazy("dummy_tapir_user_list_view")

    def form_valid(self, form):
        fire_trigger(TRIGGER_NAME_ON_DUMMY_ACCOUNT_CREATED)
        return super().form_valid(form)


class DummyTapirUserUpdateView(UpdateView):
    model = DummyTapirUser
    template_name = "dummy_accounts/dummytapiruser_create.html"
    fields = ["email"]
    success_url = reverse_lazy("dummy_tapir_user_list_view")

    def form_valid(self, form):
        fire_trigger(TRIGGER_NAME_ON_DUMMY_ACCOUNT_UPDATED)
        return super().form_valid(form)
