from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
from .models import Product, Supplier
from accounts.models import Business

class PredictiveAlert(models.Model):
    ALERT_TYPES = [
        ('reorder', 'Reorder Alert'),
        ('stockout', 'Stockout Warning'),
        ('overstock', 'Overstock Alert'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='inventory_alerts')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS)
    message = models.TextField()
    predicted_stockout_date = models.DateField(null=True, blank=True)
    suggested_order_quantity = models.PositiveIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('sent', 'Sent to Supplier'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    po_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expected_delivery = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_auto_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = f"PO-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)

class PurchaseOrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    received_quantity = models.PositiveIntegerField(default=0)
    
    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.unit_cost
        super().save(*args, **kwargs)

class SalesVelocity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='velocity')
    daily_avg_sales = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    weekly_avg_sales = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    monthly_avg_sales = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    trend_direction = models.CharField(max_length=10, choices=[('up', 'Increasing'), ('down', 'Decreasing'), ('stable', 'Stable')], default='stable')
    last_calculated = models.DateTimeField(auto_now=True)
    
    @property
    def days_until_stockout(self):
        if self.daily_avg_sales > 0:
            return int(self.product.stock_quantity / self.daily_avg_sales)
        return 999