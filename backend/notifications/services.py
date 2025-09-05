from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import EmailTemplate, EmailLog

class EmailService:
    @classmethod
    def send_low_stock_alert(cls, business, products):
        try:
            template = EmailTemplate.objects.get(name='low_stock', is_active=True)
        except EmailTemplate.DoesNotExist:
            template = cls._create_default_low_stock_template()
        
        product_list = '\n'.join([f"- {p.name}: {p.stock_quantity} remaining" for p in products])
        body = template.body.format(
            business_name=business.name,
            product_count=len(products),
            product_list=product_list
        )
        
        return cls._send_email(business, template, business.owner.email, body)
    
    @classmethod
    def send_trial_expiry_alert(cls, business, days_remaining):
        try:
            template = EmailTemplate.objects.get(name='trial_expiry', is_active=True)
        except EmailTemplate.DoesNotExist:
            template = cls._create_default_trial_expiry_template()
        
        body = template.body.format(
            business_name=business.name,
            days_remaining=days_remaining
        )
        
        return cls._send_email(business, template, business.owner.email, body)
    
    @classmethod
    def send_payment_reminder(cls, business, amount_due):
        try:
            template = EmailTemplate.objects.get(name='payment_reminder', is_active=True)
        except EmailTemplate.DoesNotExist:
            template = cls._create_default_payment_reminder_template()
        
        body = template.body.format(
            business_name=business.name,
            amount_due=amount_due
        )
        
        return cls._send_email(business, template, business.owner.email, body)
    
    @classmethod
    def _send_email(cls, business, template, recipient, body):
        log = EmailLog.objects.create(
            business=business,
            template=template,
            recipient=recipient,
            subject=template.subject
        )
        
        try:
            send_mail(
                template.subject,
                body,
                settings.FROM_EMAIL,
                [recipient],
                fail_silently=False
            )
            log.status = 'sent'
            log.sent_at = timezone.now()
        except Exception as e:
            log.status = 'failed'
            log.error_message = str(e)
        
        log.save()
        return log
    
    @classmethod
    def _create_default_low_stock_template(cls):
        return EmailTemplate.objects.create(
            name='low_stock',
            subject='Low Stock Alert - {business_name}',
            body='''Dear {business_name},

You have {product_count} products running low on stock:

{product_list}

Please restock these items to avoid stockouts.

Best regards,
SupaWave Team'''
        )
    
    @classmethod
    def _create_default_trial_expiry_template(cls):
        return EmailTemplate.objects.create(
            name='trial_expiry',
            subject='Trial Expiring Soon - {business_name}',
            body='''Dear {business_name},

Your SupaWave trial expires in {days_remaining} days.

Upgrade now to continue using all features.

Best regards,
SupaWave Team'''
        )
    
    @classmethod
    def _create_default_payment_reminder_template(cls):
        return EmailTemplate.objects.create(
            name='payment_reminder',
            subject='Payment Due - {business_name}',
            body='''Dear {business_name},

Your subscription payment of ₦{amount_due} is due.

Please make payment to continue service.

Best regards,
SupaWave Team'''
        )