from django.contrib import admin
from .models import CreditCustomer, CreditSale, CreditPayment

@admin.register(CreditCustomer)
class CreditCustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'credit_limit', 'current_balance', 'is_active']
    list_filter = ['is_active', 'business']
    search_fields = ['name', 'phone']

@admin.register(CreditSale)
class CreditSaleAdmin(admin.ModelAdmin):
    list_display = ['customer', 'total_amount', 'amount_paid', 'due_date', 'is_paid']
    list_filter = ['is_paid', 'due_date', 'business']
    search_fields = ['customer__name']

@admin.register(CreditPayment)
class CreditPaymentAdmin(admin.ModelAdmin):
    list_display = ['credit_sale', 'amount', 'payment_method', 'created_at']
    list_filter = ['payment_method', 'created_at']