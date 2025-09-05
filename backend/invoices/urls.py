from django.urls import path
from . import views

urlpatterns = [
    path('customers/', views.customers, name='customers'),
    path('', views.invoices, name='invoices'),
    path('<int:pk>/', views.invoice_detail, name='invoice_detail'),
]