from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from django.utils import timezone
from .models import (
    MarketplaceListing, MarketplaceOffer, GroupBuyRequest, 
    GroupBuyParticipant, LocalSupplier, SupplierReview, MarketplaceMessage
)
from .serializers import (
    MarketplaceListingSerializer, MarketplaceOfferSerializer, GroupBuyRequestSerializer,
    LocalSupplierSerializer, SupplierReviewSerializer, MarketplaceMessageSerializer
)

class MarketplaceListingViewSet(viewsets.ModelViewSet):
    serializer_class = MarketplaceListingSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        print(f"Creating listing with data: {request.data}")
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        queryset = MarketplaceListing.objects.filter(
            status='active',
            expires_at__gt=timezone.now()
        ).exclude(seller=self.request.user.business).select_related('seller')
        
        # Filter by type
        listing_type = self.request.query_params.get('type')
        if listing_type:
            queryset = queryset.filter(listing_type=listing_type)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(product_name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        try:
            serializer.save(seller=self.request.user.business)
        except Exception as e:
            print(f"Error creating listing: {e}")
            raise
    
    @action(detail=False, methods=['get'])
    def my_listings(self, request):
        """Get current user's listings"""
        listings = MarketplaceListing.objects.filter(
            seller=request.user.business
        ).order_by('-created_at')
        serializer = self.get_serializer(listings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def make_offer(self, request, pk=None):
        """Make an offer on a listing"""
        print(f"Making offer on listing {pk} with data: {request.data}")
        listing = get_object_or_404(MarketplaceListing, pk=pk)
        
        if listing.seller == request.user.business:
            return Response(
                {'error': 'Cannot make offer on your own listing'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = MarketplaceOfferSerializer(data=request.data)
        if serializer.is_valid():
            offer = serializer.save(
                listing=listing,
                buyer=request.user.business
            )
            
            # Create notification for listing owner
            from notifications.models import Notification
            Notification.objects.create(
                user=listing.seller.owner,
                title="New Offer Received",
                message=f"{request.user.business.name} made an offer of ₦{offer.offered_price}/unit for {offer.quantity} units of {listing.title}",
                notification_type="marketplace_offer"
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MarketplaceOfferViewSet(viewsets.ModelViewSet):
    serializer_class = MarketplaceOfferSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MarketplaceOffer.objects.filter(
            Q(buyer=self.request.user.business) | 
            Q(listing__seller=self.request.user.business)
        ).select_related('listing', 'buyer').order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept an offer"""
        offer = get_object_or_404(MarketplaceOffer, pk=pk)
        
        if offer.listing.seller != request.user.business:
            return Response(
                {'error': 'Only listing owner can accept offers'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        offer.status = 'accepted'
        offer.save()
        
        # Update listing quantity
        offer.listing.quantity -= offer.quantity
        if offer.listing.quantity <= 0:
            offer.listing.status = 'completed'
        offer.listing.save()
        
        # Notify buyer that offer was accepted
        from notifications.models import Notification
        Notification.objects.create(
            user=offer.buyer.owner,
            title="Offer Accepted!",
            message=f"Your offer for {offer.listing.title} has been accepted by {offer.listing.seller.name}. Contact them to arrange pickup/delivery.",
            notification_type="marketplace_offer_accepted"
        )
        
        # Create marketplace message thread
        from .models import MarketplaceMessage
        MarketplaceMessage.objects.create(
            sender=offer.listing.seller,
            recipient=offer.buyer,
            listing=offer.listing,
            offer=offer,
            message=f"Hi! I've accepted your offer for {offer.quantity} units of {offer.listing.product_name} at ₦{offer.offered_price}/unit. Let's arrange the transaction. My contact: [Add your contact details]"
        )
        
        return Response({
            'message': 'Offer accepted successfully',
            'buyer_contact': offer.buyer.phone or 'Contact via app messages',
            'buyer_name': offer.buyer.name,
            'delivery_needed': offer.delivery_needed
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an offer"""
        offer = get_object_or_404(MarketplaceOffer, pk=pk)
        
        if offer.listing.seller != request.user.business:
            return Response(
                {'error': 'Only listing owner can reject offers'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        offer.status = 'rejected'
        offer.save()
        return Response({'message': 'Offer rejected'})

class GroupBuyRequestViewSet(viewsets.ModelViewSet):
    serializer_class = GroupBuyRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return GroupBuyRequest.objects.filter(
            status__in=['open', 'minimum_reached'],
            deadline__gt=timezone.now()
        ).select_related('organizer').prefetch_related('participants').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user.business)
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a group buy"""
        group_buy = get_object_or_404(GroupBuyRequest, pk=pk)
        quantity = request.data.get('quantity', 0)
        
        if quantity <= 0:
            return Response(
                {'error': 'Quantity must be greater than 0'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participant, created = GroupBuyParticipant.objects.get_or_create(
            group_buy=group_buy,
            business=request.user.business,
            defaults={
                'quantity': quantity,
                'committed_amount': quantity * group_buy.target_price
            }
        )
        
        if not created:
            return Response(
                {'error': 'Already participating in this group buy'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update group buy totals
        group_buy.current_quantity += quantity
        group_buy.current_participants += 1
        
        if group_buy.current_participants >= group_buy.minimum_participants:
            group_buy.status = 'minimum_reached'
        
        group_buy.save()
        
        return Response({'message': 'Successfully joined group buy'})

class LocalSupplierViewSet(viewsets.ModelViewSet):
    serializer_class = LocalSupplierSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = LocalSupplier.objects.all().prefetch_related('reviews')
        
        # Filter by type
        supplier_type = self.request.query_params.get('type')
        if supplier_type:
            queryset = queryset.filter(supplier_type=supplier_type)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(products_offered__icontains=search) |
                Q(location__icontains=search)
            )
        
        return queryset.order_by('-rating', '-created_at')
    
    @action(detail=True, methods=['post'])
    def add_review(self, request, pk=None):
        """Add a review for a supplier"""
        supplier = get_object_or_404(LocalSupplier, pk=pk)
        
        serializer = SupplierReviewSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(
                supplier=supplier,
                reviewer=request.user.business
            )
            
            # Update supplier rating
            avg_rating = supplier.reviews.aggregate(avg=Avg('rating'))['avg']
            supplier.rating = round(avg_rating, 2) if avg_rating else 0
            supplier.total_reviews = supplier.reviews.count()
            supplier.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MarketplaceMessageViewSet(viewsets.ModelViewSet):
    serializer_class = MarketplaceMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MarketplaceMessage.objects.filter(
            Q(sender=self.request.user.business) | 
            Q(recipient=self.request.user.business)
        ).select_related('sender', 'recipient').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user.business)
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get conversation threads"""
        business = request.user.business
        
        # Get unique conversation partners
        conversations = MarketplaceMessage.objects.filter(
            Q(sender=business) | Q(recipient=business)
        ).values('sender', 'recipient').distinct()
        
        # Build conversation list with latest message
        conversation_list = []
        partners = set()
        
        for conv in conversations:
            partner = conv['recipient'] if conv['sender'] == business.id else conv['sender']
            if partner not in partners:
                partners.add(partner)
                
                latest_message = MarketplaceMessage.objects.filter(
                    Q(sender=business, recipient_id=partner) |
                    Q(sender_id=partner, recipient=business)
                ).order_by('-created_at').first()
                
                if latest_message:
                    conversation_list.append({
                        'partner_id': partner,
                        'partner_name': latest_message.recipient.name if latest_message.sender == business else latest_message.sender.name,
                        'latest_message': latest_message.message,
                        'created_at': latest_message.created_at,
                        'unread_count': MarketplaceMessage.objects.filter(
                            sender_id=partner, recipient=business, is_read=False
                        ).count()
                    })
        
        return Response(sorted(conversation_list, key=lambda x: x['created_at'], reverse=True))