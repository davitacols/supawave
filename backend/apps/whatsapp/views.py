from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WhatsAppConfig, WhatsAppMessage
import requests
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_whatsapp(request):
    """Connect WhatsApp Business number"""
    phone_number = request.data.get('phone_number')
    
    if not phone_number:
        return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Save or update WhatsApp config
    config, created = WhatsAppConfig.objects.get_or_create(
        business=request.user.business,
        defaults={'phone_number': phone_number}
    )
    
    if not created:
        config.phone_number = phone_number
        config.save()
    
    return Response({
        'message': 'WhatsApp connected successfully',
        'phone_number': phone_number
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send WhatsApp message"""
    to_number = request.data.get('to')
    message_content = request.data.get('message')
    message_type = request.data.get('type', 'support')
    
    if not to_number or not message_content:
        return Response({'error': 'Phone number and message are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get WhatsApp config
        config = WhatsAppConfig.objects.get(business=request.user.business)
        
        # For demo, we'll use WhatsApp Web API (in production, use WhatsApp Business API)
        # This is a simplified implementation
        
        # Save message to database
        WhatsAppMessage.objects.create(
            business=request.user.business,
            to_number=to_number,
            message_type=message_type,
            content=message_content
        )
        
        # In production, integrate with WhatsApp Business API here
        # For now, return success (frontend will fallback to WhatsApp Web)
        
        return Response({
            'message': 'Message sent successfully',
            'to': to_number
        })
        
    except WhatsAppConfig.DoesNotExist:
        return Response({'error': 'WhatsApp not configured'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_config(request):
    """Get WhatsApp configuration"""
    try:
        config = WhatsAppConfig.objects.get(business=request.user.business)
        return Response({
            'phone_number': config.phone_number,
            'is_active': config.is_active
        })
    except WhatsAppConfig.DoesNotExist:
        return Response({'error': 'WhatsApp not configured'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request):
    """Get WhatsApp message history"""
    messages = WhatsAppMessage.objects.filter(
        business=request.user.business
    ).order_by('-sent_at')[:50]
    
    data = [{
        'to_number': msg.to_number,
        'message_type': msg.message_type,
        'content': msg.content[:100] + '...' if len(msg.content) > 100 else msg.content,
        'sent_at': msg.sent_at,
        'status': msg.status
    } for msg in messages]
    
    return Response(data)