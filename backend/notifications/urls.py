from django.urls import path
from . import views

urlpatterns = [
    path('test-email/', views.send_test_email, name='test_email'),
    path('low-stock-alert/', views.trigger_low_stock_alert, name='low_stock_alert'),
]