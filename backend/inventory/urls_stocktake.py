from django.urls import path
from . import views_stocktake
from . import stocktake_views

urlpatterns = [
    path('stock-takes/', views_stocktake.stock_takes, name='stock_takes'),
    path('stock-takes/<uuid:pk>/', views_stocktake.stock_take_detail, name='stock_take_detail'),
    path('stock-takes/<uuid:pk>/count/', views_stocktake.update_count, name='update_count'),
    path('stock-takes/<uuid:pk>/summary/', views_stocktake.stock_take_summary, name='stock_take_summary'),
    path('daily-stocktake/trigger/', stocktake_views.trigger_daily_stocktake, name='trigger_daily_stocktake'),
    path('daily-stocktake/status/', stocktake_views.daily_stocktake_status, name='daily_stocktake_status'),
]