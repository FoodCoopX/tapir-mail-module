from rest_framework import routers

from . import views

urlpatterns = []

router = routers.DefaultRouter()
router.register("dummy_tapir_user", views.DummyTapirUserViewSet)
router.register("dummy_pickup_location", views.DummyPickupLocationViewSet)
router.register("weekdays", views.WeekdaysListView, basename="Weekdays")


urlpatterns += router.urls
