from django.db import models
from accounts.models import Business
from datetime import timedelta
from django.utils import timezone

class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ('basic', 'Basic - ₦5,000/month'),
        ('standard', 'Standard - ₦10,000/month'),
        ('premium', 'Premium - ₦20,000/month'),
    ]
    
    name = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    max_products = models.IntegerField(default=1000)
    max_staff = models.IntegerField(default=5)
    
    def __str__(self):
        return self.get_name_display()

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('trial', 'Trial'),
    ]
    
    business = models.OneToOneField(Business, on_delete=models.CASCADE, related_name='active_subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    
    @property
    def is_active(self):
        return self.status == 'active' and self.end_date > timezone.now()
    
    @property
    def days_remaining(self):
        if self.end_date > timezone.now():
            return (self.end_date - timezone.now()).days
        return 0