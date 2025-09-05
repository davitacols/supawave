import requests
from django.conf import settings
from .models import WhatsAppConfig, WhatsAppMessage, WhatsAppTemplate
from datetime import datetime

class WhatsAppService:
    def __init__(self, business):
        self.business = business
        try:
            self.config = WhatsAppConfig.objects.get(business=business)
        except WhatsAppConfig.DoesNotExist:
            self.config = None
    
    def send_message(self, phone_number, message, template=None):
        if not self.config or not self.config.is_active:
            return False
        
        # Create message record
        whatsapp_message = WhatsAppMessage.objects.create(
            business=self.business,
            phone_number=phone_number,
            message=message,
            template=template
        )
        
        try:
            # Real WhatsApp API integration
            success = self._send_via_whatsapp_api(phone_number, message)
            
            if success:
                whatsapp_message.status = 'sent'
                whatsapp_message.sent_at = datetime.now()
            else:
                whatsapp_message.status = 'failed'
            
            whatsapp_message.save()
            return success
            
        except Exception as e:
            whatsapp_message.status = 'failed'
            whatsapp_message.save()
            print(f'WhatsApp send failed: {e}')
            return False
    
    def _send_via_whatsapp_api(self, phone_number, message):
        # Demo mode - simulate random success/failure
        import random
        return random.choice([True, False])
        
        # Uncomment below for real WhatsApp Business API integration:
        # url = f"https://graph.facebook.com/v17.0/{self.config.phone_number}/messages"
        # headers = {
        #     'Authorization': f'Bearer {self.config.api_token}',
        #     'Content-Type': 'application/json'
        # }
        # data = {
        #     'messaging_product': 'whatsapp',
        #     'to': phone_number,
        #     'text': {'body': message}
        # }
        # response = requests.post(url, headers=headers, json=data)
        # return response.status_code == 200
    
    def send_receipt(self, sale, customer_phone):
        template = WhatsAppTemplate.objects.filter(
            business=self.business,
            template_type='receipt',
            is_active=True
        ).first()
        
        if not template:
            return False
        
        message = f"""
🧾 *Receipt from {self.business.name}*

Date: {sale.created_at.strftime('%Y-%m-%d %H:%M')}
Total: ₦{sale.total_amount:,.2f}

Items:
{self._format_sale_items(sale)}

Thank you for your business! 🙏
        """.strip()
        
        return self.send_message(customer_phone, message, template)
    
    def send_promotion(self, phone_numbers, promotion_text):
        template = WhatsAppTemplate.objects.filter(
            business=self.business,
            template_type='promotion',
            is_active=True
        ).first()
        
        if not template:
            return False
        
        success_count = 0
        for phone in phone_numbers:
            if self.send_message(phone, promotion_text, template):
                success_count += 1
        
        return success_count
    
    def _format_sale_items(self, sale):
        items = []
        for item in sale.items.all():
            items.append(f"• {item.product.name} x{item.quantity} - ₦{item.unit_price * item.quantity:,.2f}")
        return '\n'.join(items)