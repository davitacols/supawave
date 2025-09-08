from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from stores.models import Store
from inventory.models import Product, Category
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample store with products'

    def add_arguments(self, parser):
        parser.add_argument('--business-email', type=str, help='Business owner email')

    def handle(self, *args, **options):
        business_email = options.get('business_email')

        if business_email:
            try:
                user = User.objects.get(email=business_email)
                business = user.business
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User with email {business_email} not found'))
                return
        else:
            user = User.objects.filter(business__isnull=False).first()
            if not user:
                self.stdout.write(self.style.ERROR('No business users found'))
                return
            business = user.business

        # Create sample stores
        stores_data = [
            {'name': 'Main Store', 'address': '123 Main Street, Lagos', 'is_main_store': True},
            {'name': 'Branch Store', 'address': '456 Branch Avenue, Abuja', 'is_main_store': False},
            {'name': 'Mall Outlet', 'address': '789 Shopping Mall, Port Harcourt', 'is_main_store': False},
        ]

        for store_data in stores_data:
            store, created = Store.objects.get_or_create(
                business=business,
                name=store_data['name'],
                defaults=store_data
            )
            if created:
                self.stdout.write(f'Created store: {store.name}')
            else:
                self.stdout.write(f'Store already exists: {store.name}')

        # Create sample products if none exist
        if not Product.objects.filter(business=business).exists():
            self.stdout.write('Creating sample products...')
            
            # Create categories
            categories_data = ['Beverages', 'Snacks', 'Household', 'Personal Care']
            categories = []
            for cat_name in categories_data:
                category, created = Category.objects.get_or_create(
                    business=business,
                    name=cat_name
                )
                categories.append(category)

            # Create products
            products_data = [
                {'name': 'Coca Cola 50cl', 'category': 'Beverages', 'price': 200},
                {'name': 'Pepsi 50cl', 'category': 'Beverages', 'price': 180},
                {'name': 'Gala Sausage Roll', 'category': 'Snacks', 'price': 150},
                {'name': 'Pringles Chips', 'category': 'Snacks', 'price': 800},
                {'name': 'Detergent Powder', 'category': 'Household', 'price': 500},
                {'name': 'Toilet Paper', 'category': 'Household', 'price': 300},
                {'name': 'Toothpaste', 'category': 'Personal Care', 'price': 400},
                {'name': 'Soap Bar', 'category': 'Personal Care', 'price': 250},
            ]

            for product_data in products_data:
                category = next(c for c in categories if c.name == product_data['category'])
                product, created = Product.objects.get_or_create(
                    business=business,
                    name=product_data['name'],
                    defaults={
                        'category': category,
                        'selling_price': product_data['price'],
                        'cost_price': product_data['price'] * 0.7,  # 30% markup
                        'quantity': 0,  # Will be set per store
                        'min_stock_level': 5,
                    }
                )
                if created:
                    self.stdout.write(f'  Created product: {product.name}')

        self.stdout.write(self.style.SUCCESS('Sample store and products created!'))