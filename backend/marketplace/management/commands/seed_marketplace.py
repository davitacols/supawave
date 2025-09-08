from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import Business
from marketplace.models import MarketplaceListing, LocalSupplier

class Command(BaseCommand):
    help = 'Seed marketplace with sample listings and suppliers'

    def handle(self, *args, **options):
        # Get or create a sample business
        business, created = Business.objects.get_or_create(
            name='Sample Store',
            defaults={
                'email': 'sample@store.com',
                'phone': '08012345678',
                'address': 'Lagos, Nigeria'
            }
        )

        # Sample listings data
        listings_data = [
            {
                'listing_type': 'sell',
                'title': 'Fresh Rice - 50kg Bags Available',
                'description': 'High quality Basmati rice, just arrived from farm. Perfect condition, expires in 2 weeks.',
                'product_name': 'Basmati Rice',
                'category': 'Grains & Cereals',
                'quantity': 20,
                'unit_price': 25000,
                'location': 'Lagos Island, Lagos',
                'delivery_available': True,
                'delivery_radius': 10
            },
            {
                'listing_type': 'emergency',
                'title': 'URGENT: Need Bread for Weekend Rush',
                'description': 'Ran out of bread on busy Saturday. Need 100 loaves urgently for customers.',
                'product_name': 'Sliced Bread',
                'category': 'Bakery',
                'quantity': 100,
                'unit_price': 500,
                'location': 'Ikeja, Lagos',
                'delivery_available': False,
                'min_order_quantity': 20
            },
            {
                'listing_type': 'sell',
                'title': 'Palm Oil - Bulk Sale 20% Off',
                'description': 'Pure palm oil from local producer. Selling in bulk due to overstock. Great quality!',
                'product_name': 'Palm Oil',
                'category': 'Cooking Oil',
                'quantity': 50,
                'unit_price': 2000,
                'location': 'Onitsha, Anambra',
                'delivery_available': True,
                'delivery_radius': 15
            },
            {
                'listing_type': 'buy',
                'title': 'Looking for Fresh Tomatoes - Weekly Supply',
                'description': 'Need reliable supplier for fresh tomatoes. Looking for weekly delivery of 100kg.',
                'product_name': 'Fresh Tomatoes',
                'category': 'Vegetables',
                'quantity': 100,
                'unit_price': 800,
                'location': 'Abuja, FCT',
                'delivery_available': False
            },
            {
                'listing_type': 'sell',
                'title': 'Coca-Cola Bottles - Wholesale Price',
                'description': 'Selling Coca-Cola 50cl bottles at wholesale price. Perfect for resale.',
                'product_name': 'Coca-Cola 50cl',
                'category': 'Beverages',
                'quantity': 200,
                'unit_price': 150,
                'location': 'Kano, Kano State',
                'delivery_available': True,
                'delivery_radius': 20
            },
            {
                'listing_type': 'group_buy',
                'title': 'Group Buy: Sugar 1000kg for Bulk Price',
                'description': 'Organizing group purchase of sugar. Need 5 more stores to unlock wholesale price of ₦400/kg.',
                'product_name': 'White Sugar',
                'category': 'Sweeteners',
                'quantity': 1000,
                'unit_price': 400,
                'location': 'Port Harcourt, Rivers',
                'delivery_available': True,
                'min_order_quantity': 50
            },
            {
                'listing_type': 'sell',
                'title': 'Indomie Noodles - Carton Sale',
                'description': 'Selling Indomie noodles by carton. 40 packs per carton. Fast moving product!',
                'product_name': 'Indomie Noodles',
                'category': 'Instant Foods',
                'quantity': 30,
                'unit_price': 3200,
                'location': 'Ibadan, Oyo State',
                'delivery_available': False
            },
            {
                'listing_type': 'emergency',
                'title': 'Need Cooking Gas - Customer Waiting',
                'description': 'Customer needs 12.5kg cooking gas cylinder. Our supplier is out of stock.',
                'product_name': 'Cooking Gas 12.5kg',
                'category': 'Energy',
                'quantity': 1,
                'unit_price': 8500,
                'location': 'Enugu, Enugu State',
                'delivery_available': False
            },
            {
                'listing_type': 'sell',
                'title': 'Groundnut Oil - Local Production',
                'description': 'Fresh groundnut oil from local mill. Chemical-free, traditional processing method.',
                'product_name': 'Groundnut Oil',
                'category': 'Cooking Oil',
                'quantity': 25,
                'unit_price': 1800,
                'location': 'Kaduna, Kaduna State',
                'delivery_available': True,
                'delivery_radius': 25
            },
            {
                'listing_type': 'buy',
                'title': 'Seeking Yam Supplier - Regular Orders',
                'description': 'Looking for reliable yam supplier. Need 200 tubers weekly for our customers.',
                'product_name': 'Yam Tubers',
                'category': 'Root Vegetables',
                'quantity': 200,
                'unit_price': 1500,
                'location': 'Jos, Plateau State',
                'delivery_available': False,
                'min_order_quantity': 50
            }
        ]

        # Create listings
        created_count = 0
        for listing_data in listings_data:
            listing_data['seller'] = business
            listing_data['expires_at'] = timezone.now() + timedelta(days=7)
            
            listing, created = MarketplaceListing.objects.get_or_create(
                title=listing_data['title'],
                defaults=listing_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(f"Created listing: {listing.title}")

        # Sample suppliers data
        suppliers_data = [
            {
                'name': 'Adamu Farms',
                'supplier_type': 'farmer',
                'contact_person': 'Musa Adamu',
                'phone': '08031234567',
                'location': 'Kano State',
                'products_offered': 'Rice, Millet, Sorghum, Maize',
                'delivery_available': True,
                'minimum_order': 100000,
                'is_verified': True
            },
            {
                'name': 'Lagos Fresh Produce',
                'supplier_type': 'wholesaler',
                'contact_person': 'Chioma Okafor',
                'phone': '08059876543',
                'location': 'Mile 12 Market, Lagos',
                'products_offered': 'Tomatoes, Onions, Peppers, Vegetables',
                'delivery_available': True,
                'minimum_order': 50000,
                'is_verified': True
            },
            {
                'name': 'Golden Bakery',
                'supplier_type': 'producer',
                'contact_person': 'Ahmed Ibrahim',
                'phone': '08074567890',
                'location': 'Abuja, FCT',
                'products_offered': 'Bread, Cakes, Pastries, Biscuits',
                'delivery_available': True,
                'minimum_order': 25000,
                'is_verified': False
            },
            {
                'name': 'Ogun Palm Oil Mill',
                'supplier_type': 'producer',
                'contact_person': 'Folake Adebayo',
                'phone': '08092345678',
                'location': 'Abeokuta, Ogun State',
                'products_offered': 'Palm Oil, Palm Kernel Oil, Palm Wine',
                'delivery_available': False,
                'minimum_order': 75000,
                'is_verified': True
            },
            {
                'name': 'Northern Grains Distributor',
                'supplier_type': 'distributor',
                'contact_person': 'Yusuf Mohammed',
                'phone': '08023456789',
                'location': 'Kaduna State',
                'products_offered': 'Rice, Beans, Millet, Groundnuts, Sesame',
                'delivery_available': True,
                'minimum_order': 200000,
                'is_verified': True
            }
        ]

        # Create suppliers
        supplier_count = 0
        for supplier_data in suppliers_data:
            supplier, created = LocalSupplier.objects.get_or_create(
                name=supplier_data['name'],
                defaults=supplier_data
            )
            
            if created:
                supplier_count += 1
                self.stdout.write(f"Created supplier: {supplier.name}")

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded marketplace with {created_count} listings and {supplier_count} suppliers!'
            )
        )