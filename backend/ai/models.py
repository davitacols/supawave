from django.db import models
from accounts.models import Business
import uuid

class BusinessInsight(models.Model):
    INSIGHT_TYPES = [
        ('pricing', 'Pricing Recommendation'),
        ('inventory', 'Inventory Alert'),
        ('demand', 'Demand Forecast'),
        ('competition', 'Market Intelligence'),
        ('opportunity', 'Business Opportunity'),
        ('warning', 'Risk Warning'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='insights')
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    title = models.CharField(max_length=200)
    message = models.TextField()
    action_required = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata for tracking
    confidence_score = models.FloatField(default=0.8)  # AI confidence 0-1
    data_sources = models.JSONField(default=list)  # What data was used
    
    class Meta:
        ordering = ['-priority', '-created_at']

class MarketIntelligence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    region = models.CharField(max_length=100, default='Nigeria')
    
    # Aggregated market data
    avg_price = models.DecimalField(max_digits=10, decimal_places=2)
    min_price = models.DecimalField(max_digits=10, decimal_places=2)
    max_price = models.DecimalField(max_digits=10, decimal_places=2)
    sample_size = models.IntegerField()  # Number of stores reporting
    
    # Trend data
    price_trend = models.CharField(max_length=20, default='stable')  # rising, falling, stable
    demand_level = models.CharField(max_length=20, default='normal')  # high, normal, low
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['product_name', 'region']

class AICoachSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    query = models.TextField()
    response = models.TextField()
    language = models.CharField(max_length=10, default='en')  # en, ha, yo, ig
    session_type = models.CharField(max_length=20, default='text')  # text, voice, sms
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Performance tracking
    was_helpful = models.BooleanField(null=True, blank=True)
    feedback = models.TextField(blank=True)