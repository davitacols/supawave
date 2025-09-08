from django.db import models
from accounts.models import Business
from inventory.models import Product

class Sale(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    customer_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Sale {self.id} - {self.total_amount}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new and self.customer_phone:
            self.send_whatsapp_receipt()
    
    def send_whatsapp_receipt(self):
        try:
            from whatsapp.services import WhatsAppService
            service = WhatsAppService(self.business)
            service.send_receipt(self, self.customer_phone)
        except Exception as e:
            print(f'WhatsApp receipt failed: {e}')

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)