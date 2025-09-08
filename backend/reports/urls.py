from django.urls import path
from . import views

urlpatterns = [
    path('daily/', views.daily_report, name='daily_report'),
    path('monthly/', views.monthly_report, name='monthly_report'),
    path('yearly/', views.yearly_report, name='yearly_report'),
    path('export/daily/', views.export_daily_csv, name='export_daily_csv'),
    path('export/monthly/', views.export_monthly_csv, name='export_monthly_csv'),
    path('export/yearly/', views.export_yearly_csv, name='export_yearly_csv'),
]