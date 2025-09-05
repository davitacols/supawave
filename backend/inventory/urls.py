from django.urls import path, include
from .views import (
    products, ProductDetailView, categories, suppliers,
    low_stock_products, barcode_lookup
)
from . import views_rekognition

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
]