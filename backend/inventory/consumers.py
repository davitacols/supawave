import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

class InventoryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.business_id = self.scope['url_route']['kwargs']['business_id']
        self.room_group_name = f'inventory_{self.business_id}'
        
        # Check if user is authenticated and belongs to business
        user = self.scope["user"]
        if user == AnonymousUser or not await self.user_belongs_to_business(user, self.business_id):
            await self.close()
            return
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Handle incoming WebSocket messages if needed
        pass

    async def inventory_update(self, event):
        # Send inventory update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'inventory_update',
            'data': event['data']
        }))

    async def stock_alert(self, event):
        # Send stock alert to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'stock_alert',
            'data': event['data']
        }))

    @database_sync_to_async
    def user_belongs_to_business(self, user, business_id):
        try:
            return str(user.business.id) == business_id
        except:
            return False