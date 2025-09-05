from django.db import models
from accounts.models import Business

class Category(models.Model):
    name = models.CharField(max_length=100)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.name

class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact = models.CharField(max_length=100, blank=True)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    barcode = models.CharField(max_length=13, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    reorder_point = models.IntegerField(default=5)
    max_stock = models.IntegerField(default=100)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['barcode', 'business'],
                condition=models.Q(barcode__isnull=False) & ~models.Q(barcode=''),
                name='unique_barcode_per_business'
            )
        ]
    
    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold
    
    def __str__(self):
        return self.name