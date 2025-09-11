#!/usr/bin/env python
import os
import subprocess
import sys

def main():
    # Set environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_saas.settings')
    
    # Run migrations
    print("Running migrations...")
    subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
    
    # Collect static files
    print("Collecting static files...")
    subprocess.run([sys.executable, 'manage.py', 'collectstatic', '--noinput'], check=True)
    
    # Start server
    print("Starting server...")
    port = os.environ.get('PORT', '8000')
    subprocess.run([
        sys.executable, 'manage.py', 'runserver', f'0.0.0.0:{port}'
    ])

if __name__ == '__main__':
    main()