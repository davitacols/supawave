from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .predictive_models import PredictiveAlert, PurchaseOrder, PurchaseOrderItem
from .predictive_service import PredictiveInventoryService
from .serializers import PredictiveAlertSerializer, PurchaseOrderSerializer

class PredictiveAlertViewSet(viewsets.ModelViewSet):
    serializer_class = PredictiveAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PredictiveAlert.objects.filter(
            business=self.request.user.business,
            is_dismissed=False
        ).select_related('product', 'product__category')
    
    @action(detail=False, methods=['post'])
    def generate_alerts(self, request):
        """Generate new predictive alerts"""
        alerts_created = PredictiveInventoryService.generate_reorder_alerts(request.user.business)
        return Response({
            'message': f'Generated {alerts_created} new alerts',
            'alerts_created': alerts_created
        })
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an alert"""
        alert = get_object_or_404(PredictiveAlert, pk=pk, business=request.user.business)
        alert.is_dismissed = True
        alert.save()
        return Response({'message': 'Alert dismissed'})
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get reorder recommendations grouped by supplier"""
        recommendations = PredictiveInventoryService.get_reorder_recommendations(request.user.business)
        return Response(recommendations)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PurchaseOrder.objects.filter(
            business=self.request.user.business
        ).select_related('supplier').prefetch_related('items__product')
    
    @action(detail=False, methods=['post'])
    def create_from_alerts(self, request):
        """Create purchase order from alerts"""
        supplier_id = request.data.get('supplier_id')
        alert_ids = request.data.get('alert_ids', [])
        
        if not supplier_id or not alert_ids:
            return Response(
                {'error': 'supplier_id and alert_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alerts = PredictiveAlert.objects.filter(
            id__in=alert_ids,
            business=request.user.business,
            is_dismissed=False
        )
        
        if not alerts.exists():
            return Response(
                {'error': 'No valid alerts found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create purchase order
        from .models import Supplier
        supplier = get_object_or_404(Supplier, id=supplier_id, business=request.user.business)
        
        products_data = []
        for alert in alerts:
            products_data.append({
                'product': alert.product,
                'quantity': alert.suggested_order_quantity or alert.product.reorder_point
            })
        
        po = PredictiveInventoryService.create_auto_purchase_order(
            request.user.business, 
            supplier, 
            products_data
        )
        
        # Mark alerts as handled
        alerts.update(is_dismissed=True)
        
        serializer = self.get_serializer(po)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a purchase order"""
        po = get_object_or_404(PurchaseOrder, pk=pk, business=request.user.business)
        po.status = 'approved'
        po.save()
        return Response({'message': 'Purchase order approved'})
    
    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """Mark items as received and update inventory"""
        po = get_object_or_404(PurchaseOrder, pk=pk, business=request.user.business)
        received_items = request.data.get('items', [])
        
        for item_data in received_items:
            item_id = item_data.get('id')
            received_qty = item_data.get('received_quantity', 0)
            
            try:
                po_item = po.items.get(id=item_id)
                po_item.received_quantity = received_qty
                po_item.save()
                
                # Update product stock
                po_item.product.stock_quantity += received_qty
                po_item.product.save()
                
            except PurchaseOrderItem.DoesNotExist:
                continue
        
        # Check if all items received
        all_received = all(
            item.received_quantity >= item.quantity 
            for item in po.items.all()
        )
        
        if all_received:
            po.status = 'received'
            po.save()
        
        return Response({'message': 'Items received and inventory updated'})