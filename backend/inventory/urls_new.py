from django.urls import path
from .views_new import (
    ProductListCreateView, ProductDetailView,
    CategoryListCreateView, SupplierListCreateView,
    low_stock_products
)

urlpatterns = [
    path('products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<uuid:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/low-stock/', low_stock_products, name='low-stock-products'),
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('suppliers/', SupplierListCreateView.as_view(), name='supplier-list-create'),
]