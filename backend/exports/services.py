import csv
import json
from io import StringIO
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from datetime import datetime
from inventory.models import Product
from sales.models import Sale
from accounts.models import Business

class ExportService:
    @classmethod
    def export_products_csv(cls, business):
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Name', 'SKU', 'Category', 'Stock Quantity', 'Cost Price', 'Selling Price', 'Low Stock Threshold'])
        
        # Data
        products = Product.objects.filter(business=business)
        for product in products:
            writer.writerow([
                product.name,
                product.sku or '',
                product.category.name if product.category else '',
                product.stock_quantity,
                product.cost_price,
                product.selling_price,
                product.low_stock_threshold
            ])
        
        return cls._create_csv_response(output, 'products')
    
    @classmethod
    def export_sales_csv(cls, business, start_date=None, end_date=None):
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Date', 'Total Amount', 'Items Count', 'Customer', 'Payment Method'])
        
        # Data
        sales = Sale.objects.filter(business=business)
        if start_date:
            if isinstance(start_date, str):
                start_date = parse_date(start_date)
            if start_date:
                start_date = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
            sales = sales.filter(created_at__gte=start_date)
        if end_date:
            if isinstance(end_date, str):
                end_date = parse_date(end_date)
            if end_date:
                end_date = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
            sales = sales.filter(created_at__lte=end_date)
        
        for sale in sales:
            writer.writerow([
                sale.created_at.strftime('%Y-%m-%d %H:%M'),
                sale.total_amount,
                sale.items.count(),
                sale.customer_phone if sale.customer_phone else 'Walk-in',
                'Cash'  # Default for now
            ])
        
        return cls._create_csv_response(output, 'sales')
    
    @classmethod
    def export_inventory_report_csv(cls, business):
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Product', 'Current Stock', 'Stock Value', 'Status'])
        
        # Data
        products = Product.objects.filter(business=business)
        for product in products:
            stock_value = product.stock_quantity * product.cost_price
            status = 'Out of Stock' if product.stock_quantity == 0 else 'Low Stock' if product.stock_quantity <= product.low_stock_threshold else 'In Stock'
            
            writer.writerow([
                product.name,
                product.stock_quantity,
                stock_value,
                status
            ])
        
        return cls._create_csv_response(output, 'inventory_report')
    
    @classmethod
    def backup_business_data(cls, business):
        data = {
            'business': {
                'name': business.name,
                'address': business.address,
                'phone': business.phone,
                'email': business.email,
                'exported_at': timezone.now().isoformat()
            },
            'products': [],
            'sales': [],
            'customers': []
        }
        
        # Products
        for product in Product.objects.filter(business=business):
            data['products'].append({
                'name': product.name,
                'sku': product.sku,
                'stock_quantity': product.stock_quantity,
                'cost_price': str(product.cost_price),
                'selling_price': str(product.selling_price),
                'category': product.category.name if product.category else None
            })
        
        # Sales (last 30 days)
        recent_sales = Sale.objects.filter(
            business=business,
            created_at__gte=timezone.now() - timezone.timedelta(days=30)
        )
        for sale in recent_sales:
            data['sales'].append({
                'date': sale.created_at.isoformat(),
                'total_amount': str(sale.total_amount),
                'items_count': sale.items.count(),
                'customer_phone': sale.customer_phone or ''
            })
        
        response = HttpResponse(
            json.dumps(data, indent=2),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="supawave_backup_{timezone.now().strftime("%Y%m%d")}.json"'
        return response
    
    @classmethod
    def _create_csv_response(cls, output, filename):
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}_{timezone.now().strftime("%Y%m%d")}.csv"'
        return response