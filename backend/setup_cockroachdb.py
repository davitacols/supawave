#!/usr/bin/env python3
"""
CockroachDB Setup Script for SupaWave
Run this after setting up your CockroachDB cluster
"""

import os
import django
from django.core.management import execute_from_command_line

def setup_cockroachdb():
    """Setup CockroachDB for SupaWave"""
    
    print("🚀 Setting up CockroachDB for SupaWave...")
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_saas.settings')
    django.setup()
    
    try:
        # Run migrations
        print("📦 Running migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        # Create superuser (optional)
        print("👤 Creating superuser...")
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        admin_username = os.getenv('ADMIN_USERNAME', 'admin')
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@supawave.com')
        admin_password = os.getenv('ADMIN_PASSWORD')
        
        if admin_password and not User.objects.filter(username=admin_username).exists():
            User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password
            )
            print(f"✅ Superuser created: {admin_username}")
        else:
            print("⚠️ Skipping superuser creation - set ADMIN_PASSWORD environment variable")
        
        print("🎉 CockroachDB setup complete!")
        print("\n📋 Next steps:")
        print("1. Update your .env file with CockroachDB credentials")
        print("2. Run: python manage.py runserver")
        print("3. Access admin at: http://localhost:8000/admin")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your CockroachDB connection")
        print("2. Verify .env file has correct credentials")
        print("3. Ensure CockroachDB cluster is running")

if __name__ == '__main__':
    setup_cockroachdb()