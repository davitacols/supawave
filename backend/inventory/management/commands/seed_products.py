from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from inventory.models import Product, Category
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed 100 products for a specific user'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email to seed products for')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
            business = user.business
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} not found'))
            return

        # Create categories
        categories = [
            'Electronics', 'Clothing', 'Food & Beverages', 'Home & Garden', 
            'Health & Beauty', 'Sports', 'Books', 'Toys', 'Automotive', 'Office'
        ]
        
        category_objects = []
        for cat_name in categories:
            category, created = Category.objects.get_or_create(
                name=cat_name, 
                business=business
            )
            category_objects.append(category)

        # Product templates
        products_data = [
            ('Samsung Galaxy Phone', 'Electronics', 150000, 200000, 'PCS'),
            ('iPhone 13', 'Electronics', 180000, 250000, 'PCS'),
            ('Laptop Dell', 'Electronics', 120000, 180000, 'PCS'),
            ('Men T-Shirt', 'Clothing', 2000, 3500, 'PCS'),
            ('Women Dress', 'Clothing', 5000, 8000, 'PCS'),
            ('Jeans Trouser', 'Clothing', 4000, 7000, 'PCS'),
            ('Coca Cola 50cl', 'Food & Beverages', 150, 300, 'PCS'),
            ('Bread Loaf', 'Food & Beverages', 400, 600, 'PCS'),
            ('Rice 50kg', 'Food & Beverages', 25000, 35000, 'BAG'),
            ('Cooking Oil 1L', 'Food & Beverages', 800, 1200, 'BTL'),
            ('Soap Bar', 'Health & Beauty', 200, 400, 'PCS'),
            ('Shampoo 400ml', 'Health & Beauty', 1500, 2500, 'BTL'),
            ('Toothpaste', 'Health & Beauty', 500, 800, 'PCS'),
            ('Football', 'Sports', 3000, 5000, 'PCS'),
            ('Basketball', 'Sports', 4000, 6500, 'PCS'),
            ('Tennis Racket', 'Sports', 8000, 12000, 'PCS'),
            ('Novel Book', 'Books', 1500, 2500, 'PCS'),
            ('Textbook', 'Books', 3000, 5000, 'PCS'),
            ('Toy Car', 'Toys', 2000, 3500, 'PCS'),
            ('Doll', 'Toys', 2500, 4000, 'PCS'),
        ]

        # Generate 100 products
        created_count = 0
        for i in range(100):
            base_product = products_data[i % len(products_data)]
            name, cat_name, cost, price, unit = base_product
            
            # Add variation to make unique
            if i >= len(products_data):
                variation = i // len(products_data) + 1
                name = f"{name} V{variation}"
            
            category = next(c for c in category_objects if c.name == cat_name)
            
            # Add some randomness to prices
            cost_variation = random.randint(-10, 20)
            price_variation = random.randint(0, 30)
            
            final_cost = max(100, cost + (cost * cost_variation // 100))
            final_price = max(final_cost + 50, price + (price * price_variation // 100))
            
            product, created = Product.objects.get_or_create(
                name=name,
                business=business,
                defaults={

                    'category': category,
                    'cost_price': final_cost,
                    'selling_price': final_price,
                    'stock_quantity': random.randint(10, 100),
                    'reorder_point': random.randint(5, 15),
                    'barcode': f'BAR{1000000 + i}',
                    'sku': f'SKU{1000 + i}'
                }
            )
            
            if created:
                created_count += 1
                
                # Add to main store inventory
                from stores.models import Store, StoreInventory
                main_store = Store.objects.filter(business=business, is_main_store=True).first()
                if main_store:
                    StoreInventory.objects.get_or_create(
                        store=main_store,
                        product=product,
                        defaults={'quantity': random.randint(20, 100)}
                    )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} products for {email} and added to main store')
        )