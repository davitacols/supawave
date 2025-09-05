from django.db import models
import uuid

class EmailTemplate(models.Model):
    TEMPLATE_TYPES = [
        ('low_stock', 'Low Stock Alert'),
        ('trial_expiry', 'Trial Expiry'),
        ('payment_reminder', 'Payment Reminder'),
        ('subscription_expired', 'Subscription Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, choices=TEMPLATE_TYPES, unique=True)
    subject = models.CharField(max_length=200)
    body = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class EmailLog(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('accounts.Business', on_delete=models.CASCADE)
    template = models.ForeignKey(EmailTemplate, on_delete=models.CASCADE)
    recipient = models.EmailField()
    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)