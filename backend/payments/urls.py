from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanViewSet, SubscriptionViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet)
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    path('status/', PaymentViewSet.as_view({'get': 'status'}), name='payment-status'),
    path('cancel/', PaymentViewSet.as_view({'post': 'cancel'}), name='payment-cancel'),
]