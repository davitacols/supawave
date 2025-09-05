from rest_framework import serializers
from .models_new import Category, Supplier, Product
from .utils import generate_sku, generate_barcode

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'category', 'category_name',
            'supplier', 'supplier_name', 'cost_price', 'selling_price',
            'stock_quantity', 'low_stock_threshold', 'reorder_point',
            'max_stock', 'is_active', 'is_low_stock', 'profit_margin',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Auto-generate SKU if not provided
        if not validated_data.get('sku'):
            validated_data['sku'] = generate_sku(validated_data['name'])
        
        # Auto-generate barcode if not provided
        if not validated_data.get('barcode'):
            validated_data['barcode'] = generate_barcode()
        
        return super().create(validated_data)
    
    def validate_sku(self, value):
        if value:
            business = self.context['request'].user.business
            if Product.objects.filter(sku=value, business=business).exists():
                raise serializers.ValidationError("SKU already exists for this business")
        return value
    
    def validate_barcode(self, value):
        if value:
            business = self.context['request'].user.business
            if Product.objects.filter(barcode=value, business=business).exists():
                raise serializers.ValidationError("Barcode already exists for this business")
        return value