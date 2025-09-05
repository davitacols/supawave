from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from accounts.models import Business
import uuid

User = get_user_model()

class CreditCustomer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def available_credit(self):
        return self.credit_limit - self.current_balance
    
    @property
    def is_overdue(self):
        return CreditSale.objects.filter(
            customer=self, 
            is_paid=False, 
            due_date__lt=models.functions.Now()
        ).exists()

class CreditSale(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    customer = models.ForeignKey(CreditCustomer, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField()
    is_paid = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def balance_due(self):
        return self.total_amount - self.amount_paid

class CreditPayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_sale = models.ForeignKey(CreditSale, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    payment_method = models.CharField(max_length=50, choices=[
        ('cash', 'Cash'),
        ('mobile_money', 'Mobile Money'),
        ('bank_transfer', 'Bank Transfer'),
        ('other', 'Other')
    ], default='cash')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)