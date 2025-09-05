from rest_framework import serializers
from .models import Customer, Invoice, InvoiceItem

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'address', 'created_at']

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    class Meta:
        model = InvoiceItem
        fields = ['id', 'product', 'product_name', 'description', 'quantity', 'unit_price', 'total_price']
    
    def validate_product(self, value):
        # Convert empty string to None for database
        if value == '' or value is None:
            return None
        # Convert to integer if it's a valid product ID
        try:
            return int(value)
        except (ValueError, TypeError):
            return None
    
    def validate(self, data):
        # Auto-calculate total_price if not provided
        if 'total_price' not in data:
            data['total_price'] = data['quantity'] * data['unit_price']
        return data

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = ['id', 'customer', 'customer_name', 'invoice_number', 'issue_date', 
                 'due_date', 'subtotal', 'tax_amount', 'total_amount', 'status', 'notes', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        
        subtotal = 0
        for item_data in items_data:
            # Handle empty product field
            if item_data.get('product') == '' or item_data.get('product') is None:
                item_data.pop('product', None)
            
            # Ensure total_price is calculated
            if 'total_price' not in item_data:
                item_data['total_price'] = item_data['quantity'] * item_data['unit_price']
            
            item = InvoiceItem.objects.create(invoice=invoice, **item_data)
            subtotal += item.total_price
        
        from decimal import Decimal
        invoice.subtotal = subtotal
        invoice.tax_amount = subtotal * Decimal('0.075')  # 7.5% VAT
        invoice.total_amount = invoice.subtotal + invoice.tax_amount
        invoice.save()
        
        return invoice