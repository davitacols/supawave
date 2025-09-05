from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import SyncRecord, OfflineQueue
from inventory.models import Product
from sales.models import Sale

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sync_data(request):
    last_sync = request.GET.get('last_sync')
    if last_sync:
        last_sync = timezone.datetime.fromisoformat(last_sync.replace('Z', '+00:00'))
    else:
        last_sync = timezone.now() - timedelta(days=7)
    
    products = Product.objects.filter(
        business=request.user.business,
        updated_at__gte=last_sync
    ).values('id', 'name', 'price', 'stock_quantity', 'barcode', 'updated_at')
    
    return Response({
        'products': list(products),
        'timestamp': timezone.now().isoformat()
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_offline_data(request):
    queue_items = request.data.get('queue', [])
    processed = 0
    
    for item in queue_items:
        try:
            if item['endpoint'] == '/sales/' and item['method'] == 'POST':
                # Process offline sale
                sale_data = item['data']
                Sale.objects.create(
                    business=request.user.business,
                    total_amount=sale_data['total_amount'],
                    items=sale_data['items']
                )
                processed += 1
        except Exception as e:
            continue
    
    return Response({'processed': processed})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connection_status(request):
    return Response({'online': True, 'timestamp': timezone.now().isoformat()})