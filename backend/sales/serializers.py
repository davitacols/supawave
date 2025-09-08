from rest_framework import serializers
from .models import Sale, SaleItem
from inventory.models import Product

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), required=True)
    
    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'request' in self.context:
            user = self.context['request'].user
            if hasattr(user, 'business') and user.business:
                self.fields['product'].queryset = Product.objects.filter(business=user.business)
    

    
    def validate_product(self, value):
        if hasattr(self, 'context') and 'request' in self.context:
            user = self.context['request'].user
            if not hasattr(user, 'business') or not user.business:
                raise serializers.ValidationError('Business not found')
                
            business = user.business
            
            # Check if product belongs to user's business
            if not Product.objects.filter(id=value.id, business=business).exists():
                raise serializers.ValidationError('Product not found in your business')
                
        return value

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, write_only=True)
    
    class Meta:
        model = Sale
        fields = ['id', 'total_amount', 'created_at', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        store = validated_data.pop('store', None)
        sale = Sale.objects.create(
            business=validated_data['business'],
            store=store,
            total_amount=validated_data['total_amount']
        )
        
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            unit_price = item_data['unit_price']
            
            # Update stock
            if product.stock_quantity >= quantity:
                product.stock_quantity -= quantity
                product.save()
            
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=unit_price
            )
        
        return sale
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['items'] = SaleItemSerializer(instance.items.all(), many=True).data
        return data