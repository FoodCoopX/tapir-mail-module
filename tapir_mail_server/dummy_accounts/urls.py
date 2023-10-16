from rest_framework import routers

from . import views

urlpatterns = []

router = routers.DefaultRouter()
router.register("dummy_tapir_user", views.DummyTapirUserViewSet)
router.register("dummy_pickup_location", views.DummyPickupLocationViewSet)


urlpatterns += router.urls
