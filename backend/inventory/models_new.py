from django.db import models
from django.core.validators import MinValueValidator
from django.utils.html import escape
from accounts.models import Business
import uuid

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='categories')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['name', 'business']
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return escape(self.name)

class Supplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    contact = models.CharField(max_length=100, blank=True)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='suppliers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['name', 'business']
    
    def __str__(self):
        return escape(self.name)

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, blank=True)
    barcode = models.CharField(max_length=13, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    reorder_point = models.PositiveIntegerField(default=5)
    max_stock = models.PositiveIntegerField(default=100)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='products')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [
            ['sku', 'business'],
            ['barcode', 'business']
        ]
        indexes = [
            models.Index(fields=['business', 'is_active']),
            models.Index(fields=['business', 'category']),
            models.Index(fields=['barcode']),
            models.Index(fields=['sku']),
        ]
    
    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold
    
    @property
    def profit_margin(self):
        if self.cost_price > 0:
            return ((self.selling_price - self.cost_price) / self.cost_price) * 100
        return 0
    
    def __str__(self):
        return escape(f"{self.name} ({self.sku or 'No SKU'})")