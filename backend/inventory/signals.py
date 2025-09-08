from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Product
from .serializers import ProductSerializer

channel_layer = get_channel_layer()

@receiver(post_save, sender=Product)
def product_updated(sender, instance, created, **kwargs):
    # Send real-time update when product is created/updated
    serializer = ProductSerializer(instance)
    
    async_to_sync(channel_layer.group_send)(
        f'inventory_{instance.business.id}',
        {
            'type': 'inventory_update',
            'data': {
                'action': 'created' if created else 'updated',
                'product': serializer.data
            }
        }
    )
    
    # Send stock alert if stock quantity is low
    if instance.stock_quantity <= instance.low_stock_threshold:
        async_to_sync(channel_layer.group_send)(
            f'inventory_{instance.business.id}',
            {
                'type': 'stock_alert',
                'data': {
                    'product_id': str(instance.id),
                    'name': instance.name,
                    'quantity': instance.stock_quantity,
                    'threshold': instance.low_stock_threshold
                }
            }
        )

@receiver(post_delete, sender=Product)
def product_deleted(sender, instance, **kwargs):
    # Send real-time update when product is deleted
    async_to_sync(channel_layer.group_send)(
        f'inventory_{instance.business.id}',
        {
            'type': 'inventory_update',
            'data': {
                'action': 'deleted',
                'product_id': str(instance.id)
            }
        }
    )