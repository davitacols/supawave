from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Store, StoreInventory, InventoryTransfer, TransferItem
from .serializers import (StoreSerializer, StoreInventorySerializer, 
                         InventoryTransferSerializer, CreateTransferSerializer)

class StoreViewSet(viewsets.ModelViewSet):
    serializer_class = StoreSerializer
    pagination_class = None  # Disable pagination for stores
    
    def get_queryset(self):
        if not hasattr(self.request.user, 'business') or not self.request.user.business:
            return Store.objects.none()
        
        user_role = getattr(self.request.user, 'role', 'staff')
        
        # Staff cannot access store management
        if user_role == 'staff':
            return Store.objects.none()
        
        # Store manager only sees their store
        if hasattr(self.request.user, 'managed_store'):
            return Store.objects.filter(id=self.request.user.managed_store.id)
        
        # Business owner sees all stores
        return Store.objects.filter(business=self.request.user.business).only(
            'id', 'name', 'address', 'phone', 'manager_name', 'is_main_store', 'is_active', 'created_at'
        )
    
    def perform_create(self, serializer):
        # Only owners can create stores
        if getattr(self.request.user, 'role', 'staff') != 'owner':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only business owners can create stores")
        
        if not hasattr(self.request.user, 'business') or not self.request.user.business:
            raise ValueError("User must have a business to create stores")
        serializer.save(business=self.request.user.business)
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        store = self.get_object()
        
        # Get store performance data
        from sales.models import Sale
        from django.db.models import Sum, Count
        from datetime import datetime, timedelta
        
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Sales metrics - real store-specific data
        weekly_sales = Sale.objects.filter(
            store=store, created_at__date__gte=week_ago
        ).aggregate(
            total_revenue=Sum('total_amount'),
            total_sales=Count('id')
        )
        
        monthly_sales = Sale.objects.filter(
            store=store, created_at__date__gte=month_ago
        ).aggregate(
            total_revenue=Sum('total_amount'),
            total_sales=Count('id')
        )
        
        # Inventory metrics
        inventory_count = StoreInventory.objects.filter(store=store, quantity__gt=0).count()
        low_stock_count = StoreInventory.objects.filter(
            store=store, quantity__lte=10, quantity__gt=0
        ).count()
        
        return Response({
            'store_name': store.name,
            'weekly_revenue': weekly_sales['total_revenue'] or 0,
            'weekly_sales': weekly_sales['total_sales'] or 0,
            'monthly_revenue': monthly_sales['total_revenue'] or 0,
            'monthly_sales': monthly_sales['total_sales'] or 0,
            'inventory_count': inventory_count,
            'low_stock_count': low_stock_count,
            'performance_score': min(100, (weekly_sales['total_sales'] or 0) * 10)
        })
    
    @action(detail=True, methods=['get'])
    def inventory(self, request, pk=None):
        store = self.get_object()
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        search = request.GET.get('search', '')
        offset = (page - 1) * page_size
        
        inventory_qs = StoreInventory.objects.filter(
            store=store,
            quantity__gt=0
        ).select_related('product')
        
        if search:
            inventory_qs = inventory_qs.filter(
                product__name__icontains=search
            )
        
        total_count = inventory_qs.count()
        inventory = inventory_qs[offset:offset + page_size]
        
        data = []
        for item in inventory:
            data.append({
                'id': item.id,
                'product_name': item.product.name,
                'quantity': item.quantity,
                'reserved_quantity': item.reserved_quantity or 0,
                'available_quantity': item.quantity - (item.reserved_quantity or 0),
                'selling_price': float(item.product.selling_price)
            })
        
        return Response({
            'results': data,
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })
    
    @action(detail=True, methods=['post'])
    def set_main(self, request, pk=None):
        # Set this store as main store
        Store.objects.filter(business=request.user.business).update(is_main_store=False)
        store = self.get_object()
        store.is_main_store = True
        store.save()
        return Response({'status': 'Main store updated'})
    
    @action(detail=True, methods=['post'], url_path='assign-manager')
    def assign_manager(self, request, pk=None):
        store = self.get_object()
        manager_id = request.data.get('manager_id')
        
        if not manager_id:
            return Response({'error': 'Manager ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from accounts.models import User
        try:
            manager = User.objects.get(id=manager_id, business=request.user.business, role='manager')
        except User.DoesNotExist:
            return Response({'error': 'Manager not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Remove manager from previous store if assigned
        Store.objects.filter(manager_user=manager).update(manager_user=None)
        
        # Assign to new store
        store.manager_user = manager
        store.manager_name = f"{manager.first_name} {manager.last_name}".strip() or manager.username
        store.save()
        
        return Response({'status': 'Manager assigned successfully'})
    
    @action(detail=True, methods=['post'], url_path='add-product')
    def add_product(self, request, pk=None):
        store = self.get_object()
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 0))
        
        from inventory.models import Product
        try:
            product = Product.objects.get(id=product_id, business=request.user.business)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        store_inventory, created = StoreInventory.objects.get_or_create(
            store=store,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            store_inventory.quantity += quantity
            store_inventory.save()
        
        return Response({'status': 'Product added to store', 'quantity': store_inventory.quantity})

class InventoryTransferViewSet(viewsets.ModelViewSet):
    pagination_class = None  # Disable pagination for transfers
    
    def get_queryset(self):
        if not hasattr(self.request.user, 'business') or not self.request.user.business:
            return InventoryTransfer.objects.none()
        
        user_role = getattr(self.request.user, 'role', 'staff')
        
        # Staff cannot see transfers
        if user_role == 'staff':
            return InventoryTransfer.objects.none()
        
        return InventoryTransfer.objects.filter(
            from_store__business=self.request.user.business
        ).select_related('from_store', 'to_store', 'created_by')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateTransferSerializer
        return InventoryTransferSerializer
    
    def perform_create(self, serializer):
        # Only owners can create transfers
        if getattr(self.request.user, 'role', 'staff') != 'owner':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only business owners can create transfers")
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'pending':
            return Response({'error': 'Transfer already processed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Reserve inventory in source store
            for item in transfer.items.all():
                store_inventory, created = StoreInventory.objects.get_or_create(
                    store=transfer.from_store,
                    product=item.product,
                    defaults={'quantity': 0}
                )
                
                if store_inventory.available_quantity < item.quantity:
                    return Response({
                        'error': f'Insufficient stock for {item.product.name}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                store_inventory.reserved_quantity += item.quantity
                store_inventory.save()
            
            transfer.status = 'in_transit'
            transfer.save()
        
        return Response({'status': 'Transfer approved'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'in_transit':
            return Response({'error': 'Transfer not in transit'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            for item in transfer.items.all():
                # Remove from source store
                source_inventory = StoreInventory.objects.get(
                    store=transfer.from_store,
                    product=item.product
                )
                source_inventory.quantity -= item.quantity
                source_inventory.reserved_quantity -= item.quantity
                source_inventory.save()
                
                # Add to destination store
                dest_inventory, created = StoreInventory.objects.get_or_create(
                    store=transfer.to_store,
                    product=item.product,
                    defaults={'quantity': 0}
                )
                dest_inventory.quantity += item.quantity
                dest_inventory.save()
            
            transfer.status = 'completed'
            transfer.completed_at = timezone.now()
            transfer.save()
        
        return Response({'status': 'Transfer completed'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status == 'completed':
            return Response({'error': 'Cannot cancel completed transfer'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            if transfer.status == 'in_transit':
                # Release reserved inventory
                for item in transfer.items.all():
                    store_inventory = StoreInventory.objects.get(
                        store=transfer.from_store,
                        product=item.product
                    )
                    store_inventory.reserved_quantity -= item.quantity
                    store_inventory.save()
            
            transfer.status = 'cancelled'
            transfer.save()
        
        return Response({'status': 'Transfer cancelled'})