from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MarketplaceListingViewSet, MarketplaceOfferViewSet, GroupBuyRequestViewSet,
    LocalSupplierViewSet, MarketplaceMessageViewSet
)

router = DefaultRouter()
router.register(r'listings', MarketplaceListingViewSet, basename='marketplace-listings')
router.register(r'offers', MarketplaceOfferViewSet, basename='marketplace-offers')
router.register(r'group-buys', GroupBuyRequestViewSet, basename='group-buys')
router.register(r'suppliers', LocalSupplierViewSet, basename='local-suppliers')
router.register(r'messages', MarketplaceMessageViewSet, basename='marketplace-messages')

urlpatterns = [
    path('', include(router.urls)),
]