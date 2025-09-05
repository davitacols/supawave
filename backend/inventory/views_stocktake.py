from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Product, Category, StockTake, StockTakeItem
from .serializers import StockTakeSerializer, StockTakeItemSerializer, ProductCountSerializer
from utils.business_utils import get_user_business

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def stock_takes(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        stock_takes = StockTake.objects.filter(business=business).select_related('created_by', 'category').order_by('-created_at')[:20]
        data = []
        for st in stock_takes:
            data.append({
                'id': st.id,
                'name': st.name,
                'status': st.status,
                'category_name': st.category.name if st.category else None,
                'created_by_name': st.created_by.username,
                'created_at': st.created_at,
                'completed_at': st.completed_at,
                'notes': st.notes
            })
        return Response(data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        stock_take = StockTake.objects.create(
            business=business,
            created_by=request.user,
            name=data.get('name', f'Stock Take {timezone.now().strftime("%Y-%m-%d")}'),
            category_id=data.get('category') if data.get('category') else None,
            notes=data.get('notes', '')
        )
        
        # Create items for products in category or all products (limit to 100 for performance)
        if stock_take.category:
            products = Product.objects.filter(business=business, category=stock_take.category)[:100]
        else:
            products = Product.objects.filter(business=business)[:100]
        
        items = []
        for product in products:
            items.append(StockTakeItem(
                stock_take=stock_take,
                product=product,
                system_count=product.stock_quantity
            ))
        StockTakeItem.objects.bulk_create(items)
        
        return Response({
            'id': stock_take.id,
            'name': stock_take.name,
            'status': stock_take.status,
            'created_at': stock_take.created_at
        }, status=201)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def stock_take_detail(request, pk):
    business = get_user_business(request.user)
    
    try:
        stock_take = StockTake.objects.get(id=pk, business=business)
    except StockTake.DoesNotExist:
        return Response({'error': 'Stock take not found'}, status=404)
    
    if request.method == 'GET':
        # Get basic stock take info
        data = {
            'id': stock_take.id,
            'name': stock_take.name,
            'status': stock_take.status,
            'category_name': stock_take.category.name if stock_take.category else None,
            'created_by_name': stock_take.created_by.username,
            'created_at': stock_take.created_at,
            'completed_at': stock_take.completed_at,
            'notes': stock_take.notes,
            'items': []
        }
        
        # Get items with pagination (first 50 items)
        items = StockTakeItem.objects.filter(stock_take=stock_take).select_related('product')[:50]
        for item in items:
            data['items'].append({
                'id': item.id,
                'product': item.product.id,
                'product_name': item.product.name,
                'product_sku': item.product.sku,
                'system_count': item.system_count,
                'physical_count': item.physical_count,
                'variance': item.variance,
                'variance_reason': item.variance_reason,
                'notes': item.notes,
                'counted_at': item.counted_at
            })
        
        return Response(data)
    
    elif request.method == 'PUT':
        if request.data.get('status') == 'completed':
            stock_take.status = 'completed'
            stock_take.completed_at = timezone.now()
            stock_take.save()
            
            # Update product quantities based on physical counts
            for item in stock_take.items.all():
                if item.variance != 0:
                    item.product.stock_quantity = item.physical_count
                    item.product.save()
        
        serializer = StockTakeSerializer(stock_take)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        stock_take.delete()
        return Response(status=204)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_count(request, pk):
    business = get_user_business(request.user)
    
    try:
        stock_take = StockTake.objects.get(id=pk, business=business)
    except StockTake.DoesNotExist:
        return Response({'error': 'Stock take not found'}, status=404)
    
    serializer = ProductCountSerializer(data=request.data)
    if serializer.is_valid():
        try:
            item = StockTakeItem.objects.get(
                stock_take=stock_take,
                product_id=serializer.validated_data['product_id']
            )
            item.physical_count = serializer.validated_data['physical_count']
            item.variance_reason = serializer.validated_data.get('variance_reason', '')
            item.notes = serializer.validated_data.get('notes', '')
            item.save()
            
            return Response(StockTakeItemSerializer(item).data)
        except StockTakeItem.DoesNotExist:
            return Response({'error': 'Product not found in stock take'}, status=404)
    
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_take_summary(request, pk):
    business = get_user_business(request.user)
    
    try:
        stock_take = StockTake.objects.get(id=pk, business=business)
    except StockTake.DoesNotExist:
        return Response({'error': 'Stock take not found'}, status=404)
    
    items = stock_take.items.all()
    total_items = items.count()
    counted_items = items.filter(physical_count__gt=0).count()
    variance_items = items.exclude(variance=0).count()
    
    return Response({
        'total_items': total_items,
        'counted_items': counted_items,
        'remaining_items': total_items - counted_items,
        'variance_items': variance_items,
        'progress': (counted_items / total_items * 100) if total_items > 0 else 0
    })