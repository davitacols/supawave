from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoreViewSet, InventoryTransferViewSet

router = DefaultRouter()
router.register(r'stores', StoreViewSet, basename='store')
router.register(r'transfers', InventoryTransferViewSet, basename='transfer')

urlpatterns = [
    path('', include(router.urls)),
]