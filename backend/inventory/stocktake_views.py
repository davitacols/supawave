from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.management import call_command
from .models import StockTake

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_daily_stocktake(request):
    """
    Manually trigger daily stock take for current business
    """
    try:
        call_command('daily_stocktake', business_id=request.user.business.id)
        
        # Get the created stocktake
        stocktake = StockTake.objects.filter(
            business=request.user.business,
            stocktake_type='automatic'
        ).order_by('-created_at').first()
        
        return Response({
            'message': 'Daily stock take completed successfully',
            'stocktake_id': stocktake.id if stocktake else None,
            'items_count': stocktake.items.count() if stocktake else 0
        })
    except Exception as e:
        return Response({
            'error': f'Failed to create stock take: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_stocktake_status(request):
    """
    Check if daily stock take has been completed today
    """
    from django.utils import timezone
    
    today = timezone.now().date()
    stocktake = StockTake.objects.filter(
        business=request.user.business,
        stocktake_type='automatic',
        created_at__date=today
    ).first()
    
    return Response({
        'completed_today': stocktake is not None,
        'stocktake_id': stocktake.id if stocktake else None,
        'created_at': stocktake.created_at if stocktake else None,
        'items_count': stocktake.items.count() if stocktake else 0
    })