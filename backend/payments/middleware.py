from django.http import JsonResponse
from django.utils import timezone
from .models import Subscription

class SubscriptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip middleware for auth endpoints and admin
        if request.path.startswith('/api/auth/') or request.path.startswith('/admin/'):
            return self.get_response(request)
        
        # Skip for unauthenticated users
        if not request.user.is_authenticated:
            return self.get_response(request)
        
        # Skip for superusers
        if request.user.is_superuser:
            return self.get_response(request)
        
        try:
            subscription = Subscription.objects.get(business=request.user.business)
            
            # Check if trial has expired
            if subscription.status == 'trial' and subscription.is_trial_expired:
                subscription.status = 'expired'
                subscription.save()
            
            # Check if subscription has expired
            if subscription.status == 'active' and subscription.is_expired:
                subscription.status = 'expired'
                subscription.save()
            
            # Block access if subscription is expired (except for billing endpoints)
            if subscription.status == 'expired' and not request.path.startswith('/api/payments/'):
                return JsonResponse({
                    'error': 'Subscription expired',
                    'message': 'Please renew your subscription to continue using SupaWave',
                    'subscription_status': subscription.status
                }, status=403)
                
        except Subscription.DoesNotExist:
            # Create trial subscription for new businesses
            from .services import SubscriptionService
            SubscriptionService.create_trial_subscription(request.user.business)
        
        return self.get_response(request)