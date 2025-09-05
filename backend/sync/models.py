from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SyncRecord(models.Model):
    SYNC_TYPES = [
        ('product', 'Product'),
        ('sale', 'Sale'),
        ('customer', 'Customer'),
        ('category', 'Category'),
    ]
    
    business = models.ForeignKey('accounts.Business', on_delete=models.CASCADE)
    sync_type = models.CharField(max_length=20, choices=SYNC_TYPES)
    record_id = models.CharField(max_length=100)
    action = models.CharField(max_length=10, choices=[('create', 'Create'), ('update', 'Update'), ('delete', 'Delete')])
    data = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)
    synced = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']

class OfflineQueue(models.Model):
    business = models.ForeignKey('accounts.Business', on_delete=models.CASCADE)
    endpoint = models.CharField(max_length=200)
    method = models.CharField(max_length=10)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)