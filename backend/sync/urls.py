from django.urls import path
from . import views

urlpatterns = [
    path('data/', views.get_sync_data, name='sync-data'),
    path('upload/', views.sync_offline_data, name='sync-upload'),
    path('status/', views.connection_status, name='connection-status'),
]