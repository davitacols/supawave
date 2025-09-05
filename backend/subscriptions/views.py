from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SubscriptionPlan, Subscription

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_plans(request):
    plans = SubscriptionPlan.objects.all()
    data = [{
        'name': plan.name,
        'display_name': plan.get_name_display(),
        'price': float(plan.price),
        'max_products': plan.max_products,
        'max_staff': plan.max_staff
    } for plan in plans]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    try:
        subscription = Subscription.objects.get(business=request.user.business)
        return Response({
            'status': subscription.status,
            'plan': subscription.plan.name,
            'end_date': subscription.end_date,
            'days_remaining': subscription.days_remaining,
            'is_active': subscription.is_active
        })
    except Subscription.DoesNotExist:
        return Response({'status': 'no_subscription'}, status=404)