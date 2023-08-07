from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView

from tapir_mail_server.dummy_accounts.models import DummyTapirUser


class DummyTapirUserListView(ListView):
    model = DummyTapirUser
    template_name = "dummy_accounts/dummytapiruser_list.html"


class DummyTapirUserCreateView(CreateView):
    model = DummyTapirUser
    template_name = "dummy_accounts/dummytapiruser_create.html"
    fields = ["email"]
    success_url = reverse_lazy("dummy_tapir_user_list_view")
