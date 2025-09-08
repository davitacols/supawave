from django.db.models import Sum, Avg, Count
from django.utils import timezone
from datetime import timedelta, date
from .models import Product
from .predictive_models import PredictiveAlert, SalesVelocity, PurchaseOrder, PurchaseOrderItem
from sales.models import SaleItem

class PredictiveInventoryService:
    
    @staticmethod
    def calculate_sales_velocity(product):
        """Calculate sales velocity for a product"""
        now = timezone.now()
        
        # Get sales data for different periods
        daily_sales = SaleItem.objects.filter(
            product=product,
            sale__created_at__gte=now - timedelta(days=7)
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        weekly_sales = SaleItem.objects.filter(
            product=product,
            sale__created_at__gte=now - timedelta(days=30)
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        monthly_sales = SaleItem.objects.filter(
            product=product,
            sale__created_at__gte=now - timedelta(days=90)
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        # Calculate averages
        daily_avg = daily_sales / 7
        weekly_avg = weekly_sales / 4.3  # ~4.3 weeks in a month
        monthly_avg = monthly_sales / 3
        
        # Determine trend
        trend = 'stable'
        if daily_avg > weekly_avg * 1.2:
            trend = 'up'
        elif daily_avg < weekly_avg * 0.8:
            trend = 'down'
        
        # Update or create velocity record
        velocity, created = SalesVelocity.objects.update_or_create(
            product=product,
            defaults={
                'daily_avg_sales': daily_avg,
                'weekly_avg_sales': weekly_avg,
                'monthly_avg_sales': monthly_avg,
                'trend_direction': trend
            }
        )
        
        return velocity
    
    @staticmethod
    def generate_reorder_alerts(business):
        """Generate smart reorder alerts for all products"""
        products = Product.objects.filter(business=business, is_active=True)
        alerts_created = 0
        
        for product in products:
            velocity = PredictiveInventoryService.calculate_sales_velocity(product)
            
            # Skip if no sales history
            if velocity.daily_avg_sales == 0:
                continue
            
            days_until_stockout = velocity.days_until_stockout
            current_stock = product.stock_quantity
            
            # Determine alert priority and type
            alert_data = None
            
            if days_until_stockout <= 3:
                alert_data = {
                    'alert_type': 'stockout',
                    'priority': 'critical',
                    'message': f"{product.name} will run out in {days_until_stockout} days. Immediate reorder required!",
                    'predicted_stockout_date': date.today() + timedelta(days=days_until_stockout),
                    'suggested_order_quantity': max(int(velocity.weekly_avg_sales * 2), product.reorder_point)
                }
            elif days_until_stockout <= 7:
                alert_data = {
                    'alert_type': 'reorder',
                    'priority': 'high',
                    'message': f"{product.name} needs reordering. Current stock will last {days_until_stockout} days.",
                    'predicted_stockout_date': date.today() + timedelta(days=days_until_stockout),
                    'suggested_order_quantity': max(int(velocity.weekly_avg_sales * 1.5), product.reorder_point)
                }
            elif current_stock <= product.low_stock_threshold:
                alert_data = {
                    'alert_type': 'reorder',
                    'priority': 'medium',
                    'message': f"{product.name} is below reorder threshold ({current_stock} units remaining).",
                    'suggested_order_quantity': max(int(velocity.weekly_avg_sales), product.reorder_point)
                }
            
            # Create alert if needed and doesn't exist
            if alert_data:
                existing_alert = PredictiveAlert.objects.filter(
                    product=product,
                    alert_type=alert_data['alert_type'],
                    is_dismissed=False,
                    created_at__gte=timezone.now() - timedelta(days=1)
                ).exists()
                
                if not existing_alert:
                    PredictiveAlert.objects.create(
                        business=business,
                        product=product,
                        **alert_data
                    )
                    alerts_created += 1
        
        return alerts_created
    
    @staticmethod
    def create_auto_purchase_order(business, supplier, products_data):
        """Create automatic purchase order based on alerts"""
        po = PurchaseOrder.objects.create(
            business=business,
            supplier=supplier,
            is_auto_generated=True,
            notes="Auto-generated based on predictive analytics"
        )
        
        total_amount = 0
        for product_data in products_data:
            product = product_data['product']
            quantity = product_data['quantity']
            unit_cost = product.cost_price
            
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                product=product,
                quantity=quantity,
                unit_cost=unit_cost,
                total_cost=quantity * unit_cost
            )
            
            total_amount += quantity * unit_cost
        
        po.total_amount = total_amount
        po.save()
        
        return po
    
    @staticmethod
    def get_reorder_recommendations(business):
        """Get AI-powered reorder recommendations"""
        alerts = PredictiveAlert.objects.filter(
            business=business,
            is_dismissed=False,
            alert_type__in=['reorder', 'stockout']
        ).select_related('product', 'product__supplier')
        
        # Group by supplier for efficient ordering
        supplier_recommendations = {}
        
        for alert in alerts:
            supplier = alert.product.supplier
            if not supplier:
                continue
                
            if supplier not in supplier_recommendations:
                supplier_recommendations[supplier] = {
                    'supplier': supplier,
                    'products': [],
                    'total_cost': 0
                }
            
            product_rec = {
                'product': alert.product,
                'current_stock': alert.product.stock_quantity,
                'suggested_quantity': alert.suggested_order_quantity,
                'priority': alert.priority,
                'days_until_stockout': alert.product.velocity.days_until_stockout if hasattr(alert.product, 'velocity') else None,
                'estimated_cost': alert.suggested_order_quantity * alert.product.cost_price
            }
            
            supplier_recommendations[supplier]['products'].append(product_rec)
            supplier_recommendations[supplier]['total_cost'] += product_rec['estimated_cost']
        
        return list(supplier_recommendations.values())