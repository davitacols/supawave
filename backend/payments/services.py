import requests
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import uuid
from .models import Payment, Subscription

class PaystackService:
    BASE_URL = 'https://api.paystack.co'
    
    @classmethod
    def initialize_payment(cls, email, amount, reference=None):
        if not reference:
            reference = str(uuid.uuid4())
            
        url = f"{cls.BASE_URL}/transaction/initialize"
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        data = {
            'email': email,
            'amount': int(amount * 100),  # Convert to kobo
            'reference': reference,
            'callback_url': f"{settings.FRONTEND_URL}/payment/callback"
        }
        
        response = requests.post(url, json=data, headers=headers)
        return response.json()
    
    @classmethod
    def verify_payment(cls, reference):
        url = f"{cls.BASE_URL}/transaction/verify/{reference}"
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'
        }
        
        response = requests.get(url, headers=headers)
        return response.json()

class SubscriptionService:
    @classmethod
    def create_trial_subscription(cls, business):
        from .models import SubscriptionPlan
        
        basic_plan = SubscriptionPlan.objects.get(name='basic')
        subscription = Subscription.objects.create(
            business=business,
            plan=basic_plan,
            status='trial'
        )
        return subscription
    
    @classmethod
    def upgrade_subscription(cls, subscription, new_plan):
        subscription.plan = new_plan
        subscription.status = 'active'
        subscription.end_date = timezone.now() + timedelta(days=30)
        subscription.save()
        return subscription
    
    @classmethod
    def check_trial_expiry(cls):
        from django.core.mail import send_mail
        
        expiring_trials = Subscription.objects.filter(
            status='trial',
            trial_end_date__lte=timezone.now() + timedelta(days=3),
            trial_end_date__gt=timezone.now()
        )
        
        for subscription in expiring_trials:
            # Send trial expiry notification
            send_mail(
                'Trial Expiring Soon',
                f'Your SupaWave trial expires in {(subscription.trial_end_date - timezone.now()).days} days.',
                settings.FROM_EMAIL,
                [subscription.business.owner.email]
            )
    
    @classmethod
    def expire_trials(cls):
        expired_trials = Subscription.objects.filter(
            status='trial',
            trial_end_date__lt=timezone.now()
        )
        expired_trials.update(status='expired')
        return expired_trials.count()