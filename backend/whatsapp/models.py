from django.db import models
from accounts.models import Business

class WhatsAppConfig(models.Model):
    business = models.OneToOneField(Business, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20)
    api_token = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class WhatsAppTemplate(models.Model):
    TEMPLATE_TYPES = [
        ('receipt', 'Receipt'),
        ('promotion', 'Promotion'),
        ('restock', 'Restock Alert'),
        ('welcome', 'Welcome Message'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    message = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class WhatsAppMessage(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20)
    message = models.TextField()
    template = models.ForeignKey(WhatsAppTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)