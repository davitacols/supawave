import random
import string

def generate_barcode():
    """Generate a simple barcode for products"""
    return ''.join(random.choices(string.digits, k=12))

def validate_barcode(barcode):
    """Basic barcode validation"""
    return barcode.isdigit() and len(barcode) in [8, 12, 13]