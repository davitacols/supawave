from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
from inventory.models import Product
from sales.models import Sale
from accounts.models import Business
from .email_service import EmailService

def check_low_stock_alerts():
    """Check for low stock products and send alerts"""
    email_service = EmailService()
    # Sandbox mode: send all emails to verified address
    verified_email = 'datadisk52@gmail.com'
    
    for business in Business.objects.all():
        low_stock_products = Product.objects.filter(
            business=business,
            stock_quantity__lte=models.F('low_stock_threshold'),
            stock_quantity__gt=0
        ).select_related('category')
        
        if low_stock_products.exists():
            email_service.send_low_stock_alert(verified_email, low_stock_products)

def send_daily_reports():
    """Send daily sales reports to businesses"""
    email_service = EmailService()
    today = timezone.now().date()
    # Sandbox mode: send all emails to verified address
    verified_email = 'datadisk52@gmail.com'
    
    for business in Business.objects.all():
            
        # Get today's sales data
        sales = Sale.objects.filter(
            business=business,
            created_at__date=today
        )
        
        total_sales = sum(sale.total_amount for sale in sales)
        total_orders = sales.count()
        
        # Get top selling product
        top_product = "N/A"
        if sales.exists():
            # This is simplified - you'd want proper aggregation
            top_product = sales.first().items.first().product.name if sales.first().items.exists() else "N/A"
        
        # Get low stock count
        low_stock_count = Product.objects.filter(
            business=business,
            stock_quantity__lte=models.F('low_stock_threshold')
        ).count()
        
        report_data = {
            'date': today.strftime('%Y-%m-%d'),
            'total_sales': total_sales,
            'total_orders': total_orders,
            'top_product': top_product,
            'low_stock_count': low_stock_count
        }
        
        email_service.send_daily_report(verified_email, report_data)