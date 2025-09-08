from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import BusinessInsight, AICoachSession, MarketIntelligence
from .coach_service import BusinessCoachService
from .serializers import BusinessInsightSerializer, AICoachSessionSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_business_insights(request):
    """Get AI-generated business insights"""
    insights = BusinessInsight.objects.filter(
        business=request.user.business,
        is_dismissed=False,
        expires_at__gt=timezone.now()
    ).order_by('-priority', '-created_at')[:10]
    
    serializer = BusinessInsightSerializer(insights, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_insights(request):
    """Manually trigger insight generation"""
    try:
        coach = BusinessCoachService(request.user.business)
        insights = coach.generate_daily_insights()
        
        # Save insights to database
        saved_insights = []
        for insight in insights:
            insight.save()
            saved_insights.append(insight)
        
        serializer = BusinessInsightSerializer(saved_insights, many=True)
        return Response({
            'message': f'Generated {len(saved_insights)} new insights',
            'insights': serializer.data
        })
    except Exception as e:
        return Response({
            'error': f'Failed to generate insights: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_ai_coach(request):
    """Ask the AI business coach a question"""
    query = request.data.get('query', '').strip()
    language = request.data.get('language', 'en')
    
    if not query:
        return Response({
            'error': 'Query is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        coach = BusinessCoachService(request.user.business)
        response = coach.ask_coach(query, language)
        
        return Response({
            'query': query,
            'response': response,
            'language': language
        })
    except Exception as e:
        return Response({
            'error': f'AI coach unavailable: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_insight(request, insight_id):
    """Dismiss a business insight"""
    try:
        insight = BusinessInsight.objects.get(
            id=insight_id,
            business=request.user.business
        )
        insight.is_dismissed = True
        insight.save()
        
        return Response({'message': 'Insight dismissed'})
    except BusinessInsight.DoesNotExist:
        return Response({
            'error': 'Insight not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_insight_read(request, insight_id):
    """Mark insight as read"""
    try:
        insight = BusinessInsight.objects.get(
            id=insight_id,
            business=request.user.business
        )
        insight.is_read = True
        insight.save()
        
        return Response({'message': 'Insight marked as read'})
    except BusinessInsight.DoesNotExist:
        return Response({
            'error': 'Insight not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_market_intelligence(request):
    """Get market intelligence data"""
    # Get products from user's business
    from inventory.models import Product
    products = Product.objects.filter(
        business=request.user.business,
        is_active=True
    ).values_list('name', flat=True)[:20]
    
    # Find market data for these products
    market_data = []
    for product_name in products:
        # Match by first word of product name
        first_word = product_name.split()[0] if product_name else ''
        if len(first_word) > 2:  # Avoid very short words
            intelligence = MarketIntelligence.objects.filter(
                product_name__icontains=first_word
            ).first()
            
            if intelligence:
                market_data.append({
                    'your_product': product_name,
                    'market_product': intelligence.product_name,
                    'avg_price': intelligence.avg_price,
                    'min_price': intelligence.min_price,
                    'max_price': intelligence.max_price,
                    'sample_size': intelligence.sample_size,
                    'price_trend': intelligence.price_trend,
                    'last_updated': intelligence.last_updated
                })
    
    return Response({
        'market_data': market_data,
        'total_products_analyzed': len(market_data)
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_coach_history(request):
    """Get AI coach conversation history"""
    sessions = AICoachSession.objects.filter(
        business=request.user.business
    ).order_by('-created_at')[:20]
    
    serializer = AICoachSessionSerializer(sessions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_market_data(request):
    """Manually update market intelligence"""
    try:
        coach = BusinessCoachService(request.user.business)
        coach.update_market_intelligence()
        
        return Response({
            'message': 'Market intelligence updated successfully'
        })
    except Exception as e:
        return Response({
            'error': f'Failed to update market data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)