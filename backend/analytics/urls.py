from django.urls import path
from . import views

urlpatterns = [
    path('advanced/', views.advanced_analytics, name='advanced_analytics'),
    path('alerts/<int:alert_id>/read/', views.mark_alert_read, name='mark_alert_read'),
    path('live-metrics/', views.live_metrics, name='live_metrics'),
    path('quick-stats/', views.quick_stats, name='quick_stats'),
]