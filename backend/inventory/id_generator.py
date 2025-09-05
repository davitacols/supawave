import time
import random

def generate_product_id():
    """Generate a unique product ID using timestamp and random number"""
    timestamp = int(time.time() * 1000)  # milliseconds
    random_part = random.randint(1000, 9999)
    return f"{timestamp}{random_part}"