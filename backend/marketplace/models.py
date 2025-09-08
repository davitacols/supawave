from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
from accounts.models import Business
from inventory.models import Product

class MarketplaceListing(models.Model):
    LISTING_TYPES = [
        ('sell', 'Selling Excess Stock'),
        ('buy', 'Looking to Buy'),
        ('group_buy', 'Group Purchase'),
        ('emergency', 'Emergency Need'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='marketplace_listings')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='marketplace_listings')
    listing_type = models.CharField(max_length=20, choices=LISTING_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    product_name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_value = models.DecimalField(max_digits=12, decimal_places=2)
    expiry_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    min_order_quantity = models.PositiveIntegerField(default=1)
    delivery_available = models.BooleanField(default=False)
    delivery_radius = models.PositiveIntegerField(default=5, help_text="Delivery radius in km")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            if self.listing_type == 'emergency':
                self.expires_at = timezone.now() + timedelta(hours=24)
            else:
                self.expires_at = timezone.now() + timedelta(days=7)
        self.total_value = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @property
    def time_left(self):
        if self.is_expired:
            return "Expired"
        delta = self.expires_at - timezone.now()
        if delta.days > 0:
            return f"{delta.days} days left"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600} hours left"
        else:
            return f"{delta.seconds // 60} minutes left"

class MarketplaceOffer(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(MarketplaceListing, on_delete=models.CASCADE, related_name='offers')
    buyer = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='marketplace_offers')
    quantity = models.PositiveIntegerField()
    offered_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_needed = models.BooleanField(default=False)
    pickup_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        self.total_amount = self.quantity * self.offered_price
        super().save(*args, **kwargs)

class GroupBuyRequest(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open for Participants'),
        ('minimum_reached', 'Minimum Reached'),
        ('closed', 'Closed'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organizer = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='organized_group_buys')
    product_name = models.CharField(max_length=200)
    description = models.TextField()
    target_quantity = models.PositiveIntegerField()
    current_quantity = models.PositiveIntegerField(default=0)
    target_price = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_participants = models.PositiveIntegerField(default=3)
    current_participants = models.PositiveIntegerField(default=1)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    supplier_contact = models.CharField(max_length=200, blank=True)
    delivery_location = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def progress_percentage(self):
        return min(100, (self.current_quantity / self.target_quantity) * 100)

class GroupBuyParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group_buy = models.ForeignKey(GroupBuyRequest, on_delete=models.CASCADE, related_name='participants')
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    committed_amount = models.DecimalField(max_digits=12, decimal_places=2)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['group_buy', 'business']

class LocalSupplier(models.Model):
    SUPPLIER_TYPES = [
        ('farmer', 'Local Farmer'),
        ('producer', 'Local Producer'),
        ('wholesaler', 'Wholesaler'),
        ('distributor', 'Distributor'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    supplier_type = models.CharField(max_length=20, choices=SUPPLIER_TYPES)
    contact_person = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    location = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    products_offered = models.TextField(help_text="Comma-separated list of products")
    delivery_available = models.BooleanField(default=False)
    minimum_order = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class SupplierReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier = models.ForeignKey(LocalSupplier, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(Business, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    review_text = models.TextField()
    order_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['supplier', 'reviewer']

class MarketplaceMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='received_messages')
    listing = models.ForeignKey(MarketplaceListing, on_delete=models.CASCADE, null=True, blank=True)
    offer = models.ForeignKey(MarketplaceOffer, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)