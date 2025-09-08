from rest_framework import serializers
from .models import (
    MarketplaceListing, MarketplaceOffer, GroupBuyRequest, 
    GroupBuyParticipant, LocalSupplier, SupplierReview, MarketplaceMessage
)

class MarketplaceListingSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    time_left = serializers.CharField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    distance = serializers.SerializerMethodField()
    product_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = MarketplaceListing
        fields = [
            'id', 'seller', 'seller_name', 'product', 'product_id', 'listing_type', 'title', 'description',
            'product_name', 'category', 'quantity', 'unit_price', 'total_value',
            'expiry_date', 'location', 'status', 'min_order_quantity',
            'delivery_available', 'delivery_radius', 'created_at', 'expires_at',
            'time_left', 'is_expired', 'distance'
        ]
        read_only_fields = ['id', 'seller', 'total_value', 'created_at', 'expires_at']
    
    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        
        # Handle missing description
        if not validated_data.get('description'):
            validated_data['description'] = f"Available for sale: {validated_data.get('product_name', 'Product')}"
        
        # Auto-generate expires_at if not provided
        if not validated_data.get('expires_at'):
            if validated_data.get('listing_type') == 'emergency':
                validated_data['expires_at'] = timezone.now() + timedelta(hours=24)
            else:
                validated_data['expires_at'] = timezone.now() + timedelta(days=7)
        
        product_id = validated_data.pop('product_id', None)
        if product_id:
            from inventory.models import Product
            try:
                product = Product.objects.get(id=product_id, business=self.context['request'].user.business)
                validated_data['product'] = product
                # Auto-populate fields from product if not provided
                if not validated_data.get('product_name'):
                    validated_data['product_name'] = product.name
                if not validated_data.get('category') and product.category:
                    validated_data['category'] = product.category.name
            except Product.DoesNotExist:
                pass
        
        return super().create(validated_data)
    
    def get_distance(self, obj):
        # Calculate distance from user's location (to be implemented)
        return None

class MarketplaceOfferSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.name', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    
    class Meta:
        model = MarketplaceOffer
        fields = [
            'id', 'listing', 'listing_title', 'buyer', 'buyer_name', 'quantity',
            'offered_price', 'total_amount', 'message', 'status', 'delivery_needed',
            'pickup_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'listing', 'buyer', 'total_amount', 'created_at', 'updated_at']

class GroupBuyParticipantSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    
    class Meta:
        model = GroupBuyParticipant
        fields = ['id', 'business', 'business_name', 'quantity', 'committed_amount', 'joined_at']

class GroupBuyRequestSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.name', read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)
    participants = GroupBuyParticipantSerializer(many=True, read_only=True)
    
    class Meta:
        model = GroupBuyRequest
        fields = [
            'id', 'organizer', 'organizer_name', 'product_name', 'description',
            'target_quantity', 'current_quantity', 'target_price', 'minimum_participants',
            'current_participants', 'deadline', 'status', 'supplier_contact',
            'delivery_location', 'created_at', 'progress_percentage', 'participants'
        ]
        read_only_fields = ['id', 'organizer', 'current_quantity', 'current_participants', 'created_at']

class SupplierReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.name', read_only=True)
    
    class Meta:
        model = SupplierReview
        fields = ['id', 'reviewer', 'reviewer_name', 'rating', 'review_text', 'order_value', 'created_at']
        read_only_fields = ['id', 'reviewer', 'created_at']

class LocalSupplierSerializer(serializers.ModelSerializer):
    reviews = SupplierReviewSerializer(many=True, read_only=True)
    products_list = serializers.SerializerMethodField()
    
    class Meta:
        model = LocalSupplier
        fields = [
            'id', 'name', 'supplier_type', 'contact_person', 'phone', 'location',
            'products_offered', 'products_list', 'delivery_available', 'minimum_order',
            'rating', 'total_reviews', 'is_verified', 'created_at', 'reviews'
        ]
        read_only_fields = ['id', 'rating', 'total_reviews', 'created_at']
    
    def get_products_list(self, obj):
        return [p.strip() for p in obj.products_offered.split(',') if p.strip()]

class MarketplaceMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.name', read_only=True)
    
    class Meta:
        model = MarketplaceMessage
        fields = [
            'id', 'sender', 'sender_name', 'recipient', 'recipient_name',
            'listing', 'offer', 'message', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at']