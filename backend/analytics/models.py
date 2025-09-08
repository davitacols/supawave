from django.db import models
from accounts.models import Business
from inventory.models import Product

class BusinessMetrics(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    date = models.DateField()
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_sales = models.IntegerField(default=0)
    profit_margin = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    top_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['business', 'date']

class PredictiveAlert(models.Model):
    ALERT_TYPES = [
        ('stock_out', 'Stock Out Prediction'),
        ('demand_spike', 'Demand Spike'),
        ('slow_moving', 'Slow Moving Stock'),
        ('profit_drop', 'Profit Margin Drop'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='analytics_alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='analytics_alerts')
    message = models.TextField()
    confidence = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)