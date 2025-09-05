from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Business
from inventory.models import Product, Category, Supplier
from inventory.utils import generate_sku, generate_barcode
import random
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed 1000 products into the database'

    def handle(self, *args, **options):
        # Get the first business or create one
        try:
            business = Business.objects.first()
            if not business:
                # Create a test user and business
                user = User.objects.create_user(
                    email='test@supawave.com',
                    password='testpass123',
                    first_name='Test',
                    last_name='User'
                )
                business = Business.objects.create(
                    name='Test Store',
                    owner=user,
                    business_type='retail'
                )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating business: {e}'))
            return

        # Create categories
        categories = [
            'Electronics', 'Clothing', 'Food & Beverages', 'Books', 'Home & Garden',
            'Sports', 'Beauty', 'Automotive', 'Toys', 'Health'
        ]
        
        category_objects = []
        for cat_name in categories:
            category, created = Category.objects.get_or_create(
                name=cat_name,
                business=business
            )
            category_objects.append(category)

        # Create suppliers
        suppliers = [
            'Global Tech Ltd', 'Fashion World', 'Food Distributors Inc', 'Book Publishers',
            'Garden Supplies Co', 'Sports Equipment Ltd', 'Beauty Products Inc',
            'Auto Parts Store', 'Toy Factory', 'Health Products Ltd'
        ]
        
        supplier_objects = []
        for sup_name in suppliers:
            supplier, created = Supplier.objects.get_or_create(
                name=sup_name,
                business=business,
                defaults={'contact': f'contact@{sup_name.lower().replace(" ", "")}.com'}
            )
            supplier_objects.append(supplier)

        # Product names by category
        product_names = {
            'Electronics': [
                'Samsung Galaxy S23', 'iPhone 14 Pro', 'MacBook Air M2', 'Dell XPS 13',
                'Sony WH-1000XM4', 'AirPods Pro', 'iPad Air', 'Nintendo Switch',
                'PlayStation 5', 'Xbox Series X', 'LG OLED TV', 'Canon EOS R5',
                'Nikon D850', 'GoPro Hero 11', 'Apple Watch Series 8'
            ],
            'Clothing': [
                'Nike Air Force 1', 'Adidas Ultraboost', 'Levi\'s 501 Jeans', 'H&M T-Shirt',
                'Zara Dress', 'Uniqlo Hoodie', 'Polo Ralph Lauren Shirt', 'Gucci Handbag',
                'Ray-Ban Sunglasses', 'Timberland Boots', 'Calvin Klein Underwear',
                'Tommy Hilfiger Jacket', 'Puma Tracksuit', 'Converse Chuck Taylor'
            ],
            'Food & Beverages': [
                'Coca Cola 500ml', 'Pepsi 330ml', 'Nestle Water 1L', 'Red Bull Energy',
                'Lay\'s Potato Chips', 'Oreo Cookies', 'KitKat Chocolate', 'Pringles',
                'Doritos Nacho Cheese', 'Sprite 500ml', 'Fanta Orange', 'Monster Energy',
                'Snickers Bar', 'Mars Bar', 'Twix Chocolate'
            ],
            'Books': [
                'The Great Gatsby', 'To Kill a Mockingbird', '1984 by Orwell', 'Harry Potter',
                'Lord of the Rings', 'The Catcher in the Rye', 'Pride and Prejudice',
                'The Hobbit', 'Fahrenheit 451', 'Brave New World', 'Animal Farm',
                'Of Mice and Men', 'The Odyssey', 'Hamlet', 'Romeo and Juliet'
            ],
            'Home & Garden': [
                'IKEA Desk Lamp', 'Garden Hose 50ft', 'Flower Pot Set', 'Lawn Mower',
                'Pressure Washer', 'Garden Shears', 'Watering Can', 'Plant Fertilizer',
                'Outdoor Chair', 'BBQ Grill', 'Garden Gloves', 'Sprinkler System',
                'Hedge Trimmer', 'Leaf Blower', 'Garden Rake'
            ]
        }

        # Generate 1000 products
        products_created = 0
        
        for i in range(1000):
            # Random category
            category = random.choice(category_objects)
            supplier = random.choice(supplier_objects)
            
            # Get product names for this category, or use generic names
            if category.name in product_names:
                base_names = product_names[category.name]
                product_name = f"{random.choice(base_names)} - Model {i+1}"
            else:
                product_name = f"{category.name} Product {i+1}"
            
            # Random prices
            cost_price = Decimal(str(random.uniform(10, 500)))
            selling_price = cost_price * Decimal(str(random.uniform(1.2, 3.0)))  # 20-200% markup
            
            # Random stock
            stock_quantity = random.randint(0, 200)
            low_stock_threshold = random.randint(5, 20)
            
            try:
                product = Product.objects.create(
                    name=product_name,
                    sku=generate_sku(product_name),
                    barcode=generate_barcode(),
                    category=category,
                    supplier=supplier,
                    cost_price=round(cost_price, 2),
                    selling_price=round(selling_price, 2),
                    stock_quantity=stock_quantity,
                    low_stock_threshold=low_stock_threshold,
                    reorder_point=random.randint(3, 15),
                    max_stock=random.randint(100, 500),
                    business=business
                )
                products_created += 1
                
                if products_created % 100 == 0:
                    self.stdout.write(f'Created {products_created} products...')
                    
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating product {i+1}: {e}'))
                continue

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {products_created} products for business: {business.name}')
        )