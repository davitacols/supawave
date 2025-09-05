from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from payments.models import Subscription
from notifications.services import EmailService

class Command(BaseCommand):
    help = 'Check subscription status and send notifications'

    def handle(self, *args, **options):
        # Check trial expiry
        expiring_trials = Subscription.objects.filter(
            status='trial',
            trial_end_date__lte=timezone.now() + timedelta(days=3),
            trial_end_date__gt=timezone.now()
        )
        
        for subscription in expiring_trials:
            days_remaining = (subscription.trial_end_date - timezone.now()).days
            EmailService.send_trial_expiry_alert(subscription.business, days_remaining)
            self.stdout.write(f'Sent trial expiry alert to {subscription.business.name}')
        
        # Expire trials
        expired_trials = Subscription.objects.filter(
            status='trial',
            trial_end_date__lt=timezone.now()
        )
        expired_count = expired_trials.update(status='expired')
        self.stdout.write(f'Expired {expired_count} trials')
        
        # Check subscription expiry
        expiring_subscriptions = Subscription.objects.filter(
            status='active',
            end_date__lte=timezone.now() + timedelta(days=7),
            end_date__gt=timezone.now()
        )
        
        for subscription in expiring_subscriptions:
            EmailService.send_payment_reminder(subscription.business, subscription.plan.price)
            self.stdout.write(f'Sent payment reminder to {subscription.business.name}')
        
        self.stdout.write(self.style.SUCCESS('Subscription check completed'))