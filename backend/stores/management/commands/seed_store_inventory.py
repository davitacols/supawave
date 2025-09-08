from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from stores.models import Store, StoreInventory
from inventory.models import Product
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed products to stores'

    def add_arguments(self, parser):
        parser.add_argument('--store-id', type=str, help='Specific store ID to seed')
        parser.add_argument('--business-email', type=str, help='Business owner email')

    def handle(self, *args, **options):
        business_email = options.get('business_email')
        store_id = options.get('store_id')

        if business_email:
            try:
                user = User.objects.get(email=business_email)
                business = user.business
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User with email {business_email} not found'))
                return
        else:
            # Get first business if no email provided
            user = User.objects.filter(business__isnull=False).first()
            if not user:
                self.stdout.write(self.style.ERROR('No business users found'))
                return
            business = user.business

        # Get products for this business
        products = Product.objects.filter(business=business)
        if not products.exists():
            self.stdout.write(self.style.ERROR('No products found for this business'))
            return

        # Get stores to seed
        if store_id:
            stores = Store.objects.filter(id=store_id, business=business)
        else:
            stores = Store.objects.filter(business=business)

        if not stores.exists():
            self.stdout.write(self.style.ERROR('No stores found'))
            return

        self.stdout.write(f'Seeding {products.count()} products to {stores.count()} stores...')

        for store in stores:
            self.stdout.write(f'Seeding store: {store.name}')
            
            for product in products:
                # Random quantity between 10-100
                quantity = random.randint(10, 100)
                
                store_inventory, created = StoreInventory.objects.get_or_create(
                    store=store,
                    product=product,
                    defaults={'quantity': quantity}
                )
                
                if created:
                    self.stdout.write(f'  Added {product.name}: {quantity} units')
                else:
                    self.stdout.write(f'  {product.name} already exists: {store_inventory.quantity} units')

        self.stdout.write(self.style.SUCCESS('Successfully seeded store inventory!'))