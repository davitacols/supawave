from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid

class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ('basic', 'Basic - ₦5,000/month'),
        ('standard', 'Standard - ₦10,000/month'),
        ('premium', 'Premium - ₦20,000/month'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('trial', 'Trial'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField('accounts.Business', on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    trial_end_date = models.DateTimeField()
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.trial_end_date:
            self.trial_end_date = self.start_date + timedelta(days=14)
        if not self.end_date:
            self.end_date = self.start_date + timedelta(days=30)
        super().save(*args, **kwargs)

    @property
    def is_trial_expired(self):
        return timezone.now() > self.trial_end_date

    @property
    def is_expired(self):
        return timezone.now() > self.end_date

class Payment(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('transfer', 'Bank Transfer'),
        ('paystack', 'Paystack'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('accounts.Business', on_delete=models.CASCADE)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference = models.CharField(max_length=100, unique=True)
    paystack_reference = models.CharField(max_length=100, null=True, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)