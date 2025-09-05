from rest_framework import serializers
from .models import CreditCustomer, CreditSale, CreditPayment

class CreditCustomerSerializer(serializers.ModelSerializer):
    available_credit = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = CreditCustomer
        fields = ['id', 'name', 'phone', 'address', 'credit_limit', 'current_balance', 
                 'available_credit', 'is_overdue', 'is_active', 'created_at']

class CreditPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditPayment
        fields = ['id', 'amount', 'payment_method', 'notes', 'created_at']

class CreditSaleSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    balance_due = serializers.ReadOnlyField()
    payments = CreditPaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = CreditSale
        fields = ['id', 'customer', 'customer_name', 'customer_phone', 'total_amount', 
                 'amount_paid', 'balance_due', 'due_date', 'is_paid', 'notes', 
                 'created_at', 'payments']