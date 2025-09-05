from rest_framework import serializers
from .models import Category, Supplier, Product

class FastProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'category_name', 
            'selling_price', 'stock_quantity', 'low_stock_threshold'
        ]