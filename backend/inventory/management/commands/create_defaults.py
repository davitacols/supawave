from django.core.management.base import BaseCommand
from accounts.models import Business
from inventory.models import Category, Supplier

class Command(BaseCommand):
    help = 'Create default categories and suppliers for all businesses'

    def handle(self, *args, **options):
        businesses = Business.objects.all()
        
        default_categories = ['General', 'Electronics', 'Clothing', 'Food & Beverages', 'Health & Beauty']
        default_suppliers = ['Local Supplier', 'Wholesale Market', 'Online Vendor']
        
        for business in businesses:
            # Create categories
            for cat_name in default_categories:
                Category.objects.get_or_create(
                    name=cat_name,
                    business=business
                )
            
            # Create suppliers
            for sup_name in default_suppliers:
                Supplier.objects.get_or_create(
                    name=sup_name,
                    business=business
                )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created default categories and suppliers')
        )