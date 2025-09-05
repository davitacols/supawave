from django.urls import path
from .views import export_products, export_sales, export_inventory_report, backup_data

urlpatterns = [
    path('products/', export_products, name='export_products'),
    path('sales/', export_sales, name='export_sales'),
    path('inventory-report/', export_inventory_report, name='export_inventory_report'),
    path('backup/', backup_data, name='backup_data'),
]