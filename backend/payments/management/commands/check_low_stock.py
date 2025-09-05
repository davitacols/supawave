from django.core.management.base import BaseCommand
from django.db import models
from inventory.models import Product
from notifications.services import EmailService

class Command(BaseCommand):
    help = 'Check for low stock products and send alerts'

    def handle(self, *args, **options):
        businesses_notified = set()
        
        # Get all low stock products
        low_stock_products = Product.objects.filter(
            stock_quantity__lte=models.F('low_stock_threshold'),
            stock_quantity__gt=0
        ).select_related('business')
        
        # Group by business
        business_products = {}
        for product in low_stock_products:
            if product.business not in business_products:
                business_products[product.business] = []
            business_products[product.business].append(product)
        
        # Send notifications
        for business, products in business_products.items():
            EmailService.send_low_stock_alert(business, products)
            businesses_notified.add(business.name)
            self.stdout.write(f'Sent low stock alert to {business.name} for {len(products)} products')
        
        self.stdout.write(
            self.style.SUCCESS(f'Low stock check completed. Notified {len(businesses_notified)} businesses')
        )