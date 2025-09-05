import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_saas.settings')
django.setup()

from payments.models import SubscriptionPlan

# Create subscription plans
plans = [
    {
        'name': 'basic',
        'price': 5000,
        'features': {
            'products': 'Up to 100 products',
            'users': '1 user',
            'support': 'Email support',
            'reports': 'Basic reports'
        }
    },
    {
        'name': 'standard',
        'price': 10000,
        'features': {
            'products': 'Up to 500 products',
            'users': '3 users',
            'support': 'Priority support',
            'reports': 'Advanced reports',
            'integrations': 'WhatsApp integration'
        }
    },
    {
        'name': 'premium',
        'price': 20000,
        'features': {
            'products': 'Unlimited products',
            'users': 'Unlimited users',
            'support': '24/7 phone support',
            'reports': 'Custom reports',
            'integrations': 'All integrations',
            'api': 'API access'
        }
    }
]

for plan_data in plans:
    plan, created = SubscriptionPlan.objects.get_or_create(
        name=plan_data['name'],
        defaults={
            'price': plan_data['price'],
            'features': plan_data['features']
        }
    )
    if created:
        print(f'Created plan: {plan.name}')
    else:
        print(f'Plan already exists: {plan.name}')

print('Subscription plans setup complete!')