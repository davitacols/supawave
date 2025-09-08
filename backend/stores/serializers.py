from rest_framework import serializers
from .models import Store, StoreInventory, InventoryTransfer, TransferItem
from inventory.serializers import ProductSerializer

class StoreSerializer(serializers.ModelSerializer):
    manager_email = serializers.CharField(source='manager_user.email', read_only=True)
    
    class Meta:
        model = Store
        fields = ['id', 'name', 'address', 'phone', 'manager_name', 'manager_user', 
                 'manager_email', 'is_main_store', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at', 'manager_email']

class StoreInventorySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    selling_price = serializers.DecimalField(source='product.selling_price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = StoreInventory
        fields = ['id', 'product', 'product_name', 'quantity', 'reserved_quantity', 
                 'available_quantity', 'selling_price', 'last_updated']

class TransferItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = TransferItem
        fields = ['id', 'product', 'product_name', 'quantity']

class InventoryTransferSerializer(serializers.ModelSerializer):
    items = TransferItemSerializer(many=True, read_only=True)
    from_store_name = serializers.CharField(source='from_store.name', read_only=True)
    to_store_name = serializers.CharField(source='to_store.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = InventoryTransfer
        fields = ['id', 'from_store', 'to_store', 'from_store_name', 'to_store_name',
                 'status', 'notes', 'created_by_name', 'created_at', 'completed_at', 'items', 'total_items']
        read_only_fields = ['id', 'created_by', 'created_at']
    
    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

class CreateTransferSerializer(serializers.ModelSerializer):
    items = serializers.ListField(
        child=serializers.DictField(), write_only=True
    )
    
    class Meta:
        model = InventoryTransfer
        fields = ['from_store', 'to_store', 'notes', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        transfer = InventoryTransfer.objects.create(**validated_data)
        
        from inventory.models import Product
        for item_data in items_data:
            product_id = item_data.get('product')
            quantity = int(item_data.get('quantity', 0))
            
            if product_id and quantity > 0:
                try:
                    product = Product.objects.get(id=product_id)
                    TransferItem.objects.create(
                        transfer=transfer,
                        product=product,
                        quantity=quantity
                    )
                except Product.DoesNotExist:
                    continue
        
        return transfer