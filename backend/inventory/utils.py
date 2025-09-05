import random
import string
from datetime import datetime

def generate_sku(product_name):
    """Generate SKU from product name + timestamp"""
    prefix = ''.join(word[:2].upper() for word in product_name.split()[:2])
    timestamp = datetime.now().strftime('%m%d%H%M')
    return f"{prefix}-{timestamp}"

def generate_barcode():
    """Generate 13-digit barcode"""
    return ''.join(random.choices(string.digits, k=13))

def generate_product_code():
    """Generate unique product code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))