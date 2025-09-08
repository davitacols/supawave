from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from django.db import models
from inventory.models import Product, StockTake, StockTakeItem
from accounts.models import Business
from notifications.models import Notification

class Command(BaseCommand):
    help = 'Create automatic daily stock take for all businesses'

    def add_arguments(self, parser):
        parser.add_argument(
            '--business-id',
            type=int,
            help='Run for specific business ID only',
        )

    def handle(self, *args, **options):
        business_id = options.get('business_id')
        
        if business_id:
            businesses = Business.objects.filter(id=business_id)
        else:
            businesses = Business.objects.filter(is_active=True)
        
        for business in businesses:
            self.create_daily_stocktake(business)
    
    def create_daily_stocktake(self, business):
        from sales.models import Sale, SaleItem
        from decimal import Decimal
        
        today = timezone.now().date()
        
        # Check if stocktake already exists for today
        existing = StockTake.objects.filter(
            business=business,
            created_at__date=today,
            stocktake_type='automatic'
        ).first()
        
        if existing:
            self.stdout.write(f'Daily stocktake already exists for {business.name}')
            return
        
        # Calculate daily business metrics
        daily_sales = Sale.objects.filter(
            business=business,
            created_at__date=today
        )
        
        total_revenue = daily_sales.aggregate(total=models.Sum('total_amount'))['total'] or Decimal('0')
        total_transactions = daily_sales.count()
        items_sold_today = SaleItem.objects.filter(
            sale__in=daily_sales
        ).aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # Calculate inventory values
        products = Product.objects.filter(business=business, is_active=True)
        total_inventory_value = sum(
            product.stock_quantity * product.cost_price for product in products
        )
        total_retail_value = sum(
            product.stock_quantity * product.selling_price for product in products
        )
        low_stock_items = products.filter(stock_quantity__lte=models.F('low_stock_threshold')).count()
        out_of_stock_items = products.filter(stock_quantity=0).count()
        
        # Create comprehensive stocktake notes
        comprehensive_notes = f"""DAILY BUSINESS REPORT - {today}
        
=== SALES SUMMARY ===
Total Revenue: ₦{total_revenue:,.2f}
Transactions: {total_transactions}
Items Sold: {items_sold_today}

=== INVENTORY SUMMARY ===
Total Products: {products.count()}
Inventory Cost Value: ₦{total_inventory_value:,.2f}
Inventory Retail Value: ₦{total_retail_value:,.2f}
Low Stock Items: {low_stock_items}
Out of Stock Items: {out_of_stock_items}

=== STOCK LEVELS ===
All product quantities recorded as of end of business day.
Variance = 0 (automatic system snapshot)

Generated automatically by SupaWave system."""
        
        # Create new stocktake
        stocktake = StockTake.objects.create(
            business=business,
            name=f'Daily Business Report - {today}',
            stocktake_type='automatic',
            status='completed',
            notes=comprehensive_notes
        )
        
        # Add all products with current stock levels and detailed notes
        items_created = 0
        
        for product in products:
            # Calculate product-specific metrics
            product_sales_today = SaleItem.objects.filter(
                sale__in=daily_sales,
                product=product
            ).aggregate(total=models.Sum('quantity'))['total'] or 0
            
            product_revenue_today = SaleItem.objects.filter(
                sale__in=daily_sales,
                product=product
            ).aggregate(total=models.Sum('total_price'))['total'] or Decimal('0')
            
            product_notes = f"""Stock: {product.stock_quantity} units
Sold Today: {product_sales_today} units
Revenue Today: ₦{product_revenue_today:,.2f}
Cost Value: ₦{product.stock_quantity * product.cost_price:,.2f}
Retail Value: ₦{product.stock_quantity * product.selling_price:,.2f}
Status: {'LOW STOCK' if product.is_low_stock else 'OK'}"""
            
            StockTakeItem.objects.create(
                stocktake=stocktake,
                product=product,
                expected_quantity=product.stock_quantity,
                actual_quantity=product.stock_quantity,
                variance=0,
                notes=product_notes
            )
            items_created += 1
        
        # Create comprehensive notification
        notification_message = f"""Daily Business Report completed:
• Revenue: ₦{total_revenue:,.2f} ({total_transactions} transactions)
• Items Sold: {items_sold_today}
• Inventory Value: ₦{total_inventory_value:,.2f}
• Products Recorded: {items_created}
• Low Stock Alerts: {low_stock_items}"""
        
        Notification.objects.create(
            user=business.owner,
            title='Daily Business Report Ready',
            message=notification_message,
            notification_type='daily_report'
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Created comprehensive daily report for {business.name}: ₦{total_revenue:,.2f} revenue, {items_created} products'
            )
        )