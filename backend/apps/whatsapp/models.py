from django.db import models
from apps.authentication.models import Business

class WhatsAppConfig(models.Model):
    business = models.OneToOneField(Business, on_delete=models.CASCADE, related_name='whatsapp_config')
    phone_number = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    webhook_url = models.URLField(blank=True, null=True)
    access_token = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business.name} - {self.phone_number}"

class WhatsAppMessage(models.Model):
    MESSAGE_TYPES = [
        ('receipt', 'Receipt'),
        ('alert', 'Stock Alert'),
        ('order', 'Order Confirmation'),
        ('support', 'Customer Support'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    to_number = models.CharField(max_length=20)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES)
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='sent')
    
    def __str__(self):
        return f"{self.message_type} to {self.to_number}"