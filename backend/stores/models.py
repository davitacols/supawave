from django.db import models
from django.conf import settings
import uuid
from accounts.models import Business

class Store(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='stores')
    name = models.CharField(max_length=100)
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    manager_name = models.CharField(max_length=100, blank=True)
    manager_user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_store')
    is_main_store = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['business', 'name']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.business.name} - {self.name}"

class StoreInventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='inventory')
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)
    reserved_quantity = models.IntegerField(default=0)  # For pending transfers
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['store', 'product']
    
    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

class InventoryTransfer(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_transit', 'In Transit'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='transfers_out')
    to_store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='transfers_in')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Transfer #{self.id.hex[:8]} - {self.from_store.name} to {self.to_store.name}"

class TransferItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transfer = models.ForeignKey(InventoryTransfer, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE)
    quantity = models.IntegerField()
    
    class Meta:
        unique_together = ['transfer', 'product']