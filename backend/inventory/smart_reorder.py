from django.db.models import Avg, Sum
from django.utils import timezone
from datetime import timedelta
from .models import Product
from sales.models import SaleItem

def calculate_smart_reorder(product):
    """Calculate smart reorder quantity based on sales history"""
    now = timezone.now()
    
    # Get sales data for last 30 days
    sales_data = SaleItem.objects.filter(
        product=product,
        sale__created_at__gte=now - timedelta(days=30)
    )
    
    if not sales_data.exists():
        return product.reorder_point
    
    # Calculate average daily sales
    daily_avg = sales_data.aggregate(
        avg_daily=Avg('quantity')
    )['avg_daily'] or 0
    
    # Lead time assumption (7 days)
    lead_time = 7
    
    # Safety stock (20% buffer)
    safety_stock = daily_avg * 0.2
    
    # Reorder point = (average daily sales × lead time) + safety stock
    smart_reorder = (daily_avg * lead_time) + safety_stock
    
    return max(int(smart_reorder), product.reorder_point)

def get_reorder_suggestions(business):
    """Get products that need reordering"""
    products = Product.objects.filter(business=business)
    suggestions = []
    
    for product in products:
        smart_reorder = calculate_smart_reorder(product)
        if product.stock_quantity <= smart_reorder:
            suggested_quantity = product.max_stock - product.stock_quantity
            suggestions.append({
                'product': product,
                'current_stock': product.stock_quantity,
                'reorder_point': smart_reorder,
                'suggested_quantity': suggested_quantity
            })
    
    return suggestions