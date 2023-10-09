from rest_framework import routers

from . import views

urlpatterns = []

router = routers.DefaultRouter()
router.register("dummy_tapir_user", views.DummyTapirUserViewSet)

urlpatterns += router.urls
