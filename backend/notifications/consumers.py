import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from accounts.models import User

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get token from query string
        token = self.scope['query_string'].decode().split('token=')[1] if 'token=' in self.scope['query_string'].decode() else None
        
        if token:
            try:
                # Validate token
                UntypedToken(token)
                user = await self.get_user_from_token(token)
                if user and user.business:
                    self.user = user
                    self.business_group = f'business_{user.business.id}'
                    
                    # Join business group
                    await self.channel_layer.group_add(
                        self.business_group,
                        self.channel_name
                    )
                    await self.accept()
                else:
                    await self.close()
            except (InvalidToken, TokenError):
                await self.close()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'business_group'):
            await self.channel_layer.group_discard(
                self.business_group,
                self.channel_name
            )

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except:
            return None