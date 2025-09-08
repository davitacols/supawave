from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Sale

channel_layer = get_channel_layer()

@receiver(post_save, sender=Sale)
def sale_created(sender, instance, created, **kwargs):
    if created:
        # Create notification for sale
        from notifications.models import Notification
        notification = Notification.objects.create(
            business=instance.business,
            type='sale',
            title='New Sale',
            message=f'Sale completed - ₦{instance.total_amount:,.0f}',
            data={'sale_id': str(instance.id), 'amount': float(instance.total_amount)}
        )
        
        # Send real-time notification
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'business_{instance.business.id}',
                {
                    'type': 'send_notification',
                    'notification': {
                        'id': notification.id,
                        'type': notification.type,
                        'title': notification.title,
                        'message': notification.message,
                        'created_at': notification.created_at.isoformat(),
                        'is_read': False
                    }
                }
            )