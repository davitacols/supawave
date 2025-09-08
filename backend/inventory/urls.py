from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    products, ProductDetailView, categories, suppliers,
    low_stock_products, barcode_lookup
)
from . import views_rekognition
from .predictive_views import PredictiveAlertViewSet, PurchaseOrderViewSet

router = DefaultRouter()
router.register(r'alerts', PredictiveAlertViewSet, basename='predictive-alerts')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-orders')

urlpatterns = [
    path('products/', products, name='product-list-create'),
    path('products/<uuid:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/low-stock/', low_stock_products, name='low-stock-products'),
    path('products/barcode/<str:barcode>/', barcode_lookup, name='barcode-lookup'),
    path('categories/', categories, name='category-list-create'),
    path('suppliers/', suppliers, name='supplier-list-create'),
    path('analyze-image/', views_rekognition.analyze_product_image, name='analyze_image'),
    path('check-duplicates/', views_rekognition.check_duplicate_products, name='check_duplicates'),
    path('', include('inventory.urls_stocktake')),
    path('', include(router.urls)),
]