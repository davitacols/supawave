from rest_framework import serializers
from .models import Category, Supplier, Product, StockTake, StockTakeItem
from .utils import generate_sku, generate_barcode
from .rekognition_service import RekognitionService

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
    is_low_stock = serializers.BooleanField(read_only=True)
    category = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    supplier = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'image', 'category', 'supplier', 
            'cost_price', 'selling_price', 'stock_quantity', 
            'low_stock_threshold', 'reorder_point', 'max_stock', 
            'is_active', 'is_low_stock', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Analyze image with Rekognition if provided
        image = validated_data.get('image')
        if image:
            try:
                rekognition = RekognitionService()
                image_bytes = image.read()
                image.seek(0)  # Reset file pointer
                
                analysis = rekognition.analyze_product_image(image_bytes)
                if analysis and not validated_data.get('category'):
                    # Auto-suggest category if not provided
                    suggested_category = analysis['suggested_category']
                    category, _ = Category.objects.get_or_create(name=suggested_category)
                    validated_data['category'] = category.id
            except Exception as e:
                pass  # Continue without analysis if it fails
        
        # Handle category and supplier as optional
        category_id = validated_data.pop('category', None)
        supplier_id = validated_data.pop('supplier', None)
        
        # Set to None if invalid or empty
        if category_id and category_id != '':
            try:
                validated_data['category'] = Category.objects.get(id=category_id)
            except (Category.DoesNotExist, ValueError):
                validated_data['category'] = None
        else:
            validated_data['category'] = None
            
        if supplier_id and supplier_id != '':
            try:
                validated_data['supplier'] = Supplier.objects.get(id=supplier_id)
            except (Supplier.DoesNotExist, ValueError):
                validated_data['supplier'] = None
        else:
            validated_data['supplier'] = None
        
        # Auto-generate SKU and barcode if not provided
        if not validated_data.get('sku'):
            from .utils import generate_sku
            validated_data['sku'] = generate_sku(validated_data['name'])
            
        if not validated_data.get('barcode'):
            from .utils import generate_barcode
            validated_data['barcode'] = generate_barcode()
        
        return super().create(validated_data)

class StockTakeItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = StockTakeItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'system_count', 
                 'physical_count', 'variance', 'variance_reason', 'notes', 'counted_at']

class StockTakeSerializer(serializers.ModelSerializer):
    items = StockTakeItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = StockTake
        fields = ['id', 'name', 'status', 'category', 'category_name', 'created_by_name', 
                 'created_at', 'completed_at', 'notes', 'items']

class ProductCountSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    physical_count = serializers.IntegerField(min_value=0)
    variance_reason = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)