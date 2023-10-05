from django.urls import path

from . import views

urlpatterns = [
    path(
        "",
        views.DummyTapirUserListView.as_view(),
        name="dummy_tapir_user_list_view",
    ),
    path(
        "dummy_tapir_user_create_view",
        views.DummyTapirUserCreateView.as_view(),
        name="dummy_tapir_user_create_view",
    ),
    path(
        "dummy_tapir_user_update_view/<int:pk>",
        views.DummyTapirUserUpdateView.as_view(),
        name="dummy_tapir_user_update_view",
    ),
]
