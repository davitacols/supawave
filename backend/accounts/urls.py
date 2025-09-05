from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('business/', views.BusinessDetailView.as_view(), name='business-detail'),
    path('staff/', views.StaffListCreateView.as_view(), name='staff-list'),
    path('staff/<int:pk>/', views.StaffDetailView.as_view(), name='staff-detail'),
]