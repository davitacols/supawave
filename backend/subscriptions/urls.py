from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.get_plans, name='subscription-plans'),
    path('status/', views.subscription_status, name='subscription-status'),
]