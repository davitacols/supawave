from django.contrib import admin
from .models import Store, StoreInventory, InventoryTransfer, TransferItem

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'business', 'is_main_store', 'is_active', 'created_at']
    list_filter = ['is_main_store', 'is_active', 'business']
    search_fields = ['name', 'business__name']

@admin.register(StoreInventory)
class StoreInventoryAdmin(admin.ModelAdmin):
    list_display = ['store', 'product', 'quantity', 'reserved_quantity', 'last_updated']
    list_filter = ['store', 'last_updated']
    search_fields = ['store__name', 'product__name']

@admin.register(InventoryTransfer)
class InventoryTransferAdmin(admin.ModelAdmin):
    list_display = ['id', 'from_store', 'to_store', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['from_store__name', 'to_store__name']

@admin.register(TransferItem)
class TransferItemAdmin(admin.ModelAdmin):
    list_display = ['transfer', 'product', 'quantity']
    list_filter = ['transfer__status']
    search_fields = ['product__name']