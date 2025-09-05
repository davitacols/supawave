from django.core.management.base import BaseCommand
from django.db import models
from accounts.models import Business
from notifications.utils import create_system_notification, create_stock_alert
from inventory.models import Product

class Command(BaseCommand):
    help = 'Create sample notifications for testing'

    def handle(self, *args, **options):
        businesses = Business.objects.all()
        
        for business in businesses:
            # Welcome notification
            create_system_notification(
                business,
                'Welcome to SupaWave!',
                'Your inventory management system is ready. Start by adding products and making sales.'
            )
            
            # Check for low stock products
            low_stock_products = Product.objects.filter(
                business=business,
                stock_quantity__lte=models.F('low_stock_threshold')
            )
            
            for product in low_stock_products:
                create_stock_alert(business, product)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample notifications')
        )