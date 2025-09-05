from django.urls import path
from . import views

urlpatterns = [
    path('', views.sales, name='sales'),
    path('analytics/', views.sales_analytics, name='sales_analytics'),
    path('receipt/<int:sale_id>/', views.get_receipt, name='get_receipt'),
]