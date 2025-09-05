from django.urls import path
from . import views

urlpatterns = [
    path('customers/', views.credit_customers, name='credit_customers'),
    path('customers/<uuid:pk>/', views.credit_customer_detail, name='credit_customer_detail'),
    path('sales/', views.credit_sales, name='credit_sales'),
    path('sales/<uuid:sale_id>/payment/', views.record_payment, name='record_payment'),
    path('dashboard/', views.credit_dashboard, name='credit_dashboard'),
]