from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/inventory/(?P<business_id>\w+)/$', consumers.InventoryConsumer.as_asgi()),
]