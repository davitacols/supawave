from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='owner')
    phone_number = models.CharField(max_length=15, blank=True)
    business = models.ForeignKey('Business', on_delete=models.CASCADE, null=True, blank=True)
    is_active_staff = models.BooleanField(default=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    profile_image = models.ImageField(upload_to='staff_photos/', blank=True, null=True)

class Business(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    registration_date = models.DateTimeField(auto_now_add=True)
    trial_end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_business')
    logo = models.ImageField(upload_to='business_logos/', blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    secondary_color = models.CharField(max_length=7, default='#6B7280')

    def __str__(self):
        return self.name