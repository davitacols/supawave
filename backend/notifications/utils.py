from .services import EmailService

def create_stock_alert(business, product):
    """Create low stock notification"""
    EmailService.send_low_stock_alert(business, [product])

def create_sale_milestone(business, milestone_amount):
    """Create sales milestone notification"""
    # Log milestone achievement
    print(f'Sales milestone reached for {business.name}: ₦{milestone_amount:,.2f}')

def create_system_notification(business, title, message):
    """Create system notification"""
    # Log system notification
    print(f'System notification for {business.name}: {title} - {message}')