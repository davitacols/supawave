from datetime import datetime

def generate_receipt_text(sale, business):
    """Generate a formatted receipt text"""
    receipt_lines = [
        '=' * 40,
        business.name.upper().center(40),
        business.location.center(40),
        '=' * 40,
        '',
        f"Receipt #: {sale.id}",
        f"Date: {sale.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
        '',
        f"{'ITEM':<20} {'QTY':<5} {'PRICE':<8} {'TOTAL':<8}",
        '-' * 40
    ]
    
    for item in sale.items.all():
        name = item.product.name[:18] + '..' if len(item.product.name) > 20 else item.product.name
        receipt_lines.append(f"{name:<20} {item.quantity:<5} ₦{item.unit_price:<7} ₦{item.total_price:<7}")
    
    receipt_lines.extend([
        '-' * 40,
        f"{'TOTAL:':<32} ₦{sale.total_amount}",
        '=' * 40,
        '',
        'Thank you for your business!',
        'Visit us again soon.',
        '',
        '=' * 40
    ])
    
    return '\n'.join(receipt_lines)

def generate_receipt_data(sale, business):
    """Generate receipt data for frontend"""
    return {
        'receipt_id': sale.id,
        'business_name': business.name,
        'business_location': business.location,
        'date': sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'items': [{
            'name': item.product.name,
            'quantity': item.quantity,
            'unit_price': float(item.unit_price),
            'total_price': float(item.total_price)
        } for item in sale.items.all()],
        'total_amount': float(sale.total_amount),
        'receipt_text': generate_receipt_text(sale, business)
    }