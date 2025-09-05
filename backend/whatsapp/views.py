from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WhatsAppConfig, WhatsAppTemplate, WhatsAppMessage
from .serializers import WhatsAppConfigSerializer, WhatsAppTemplateSerializer, WhatsAppMessageSerializer
from .services import WhatsAppService

class WhatsAppConfigView(generics.RetrieveUpdateAPIView):
    serializer_class = WhatsAppConfigSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        business = self.request.user.businesses.first()
        config, created = WhatsAppConfig.objects.get_or_create(business=business)
        return config

class WhatsAppTemplateListView(generics.ListCreateAPIView):
    serializer_class = WhatsAppTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        business = self.request.user.businesses.first()
        return WhatsAppTemplate.objects.filter(business=business)
    
    def perform_create(self, serializer):
        business = self.request.user.businesses.first()
        serializer.save(business=business)

class WhatsAppMessageListView(generics.ListAPIView):
    serializer_class = WhatsAppMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        business = self.request.user.businesses.first()
        return WhatsAppMessage.objects.filter(business=business).order_by('-created_at')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_promotion(request):
    business = request.user.businesses.first()
    phone_numbers = request.data.get('phone_numbers', [])
    message = request.data.get('message', '')
    
    if not phone_numbers or not message:
        return Response({'error': 'Phone numbers and message required'}, status=400)
    
    service = WhatsAppService(business)
    success_count = service.send_promotion(phone_numbers, message)
    
    return Response({
        'message': f'Sent to {success_count} out of {len(phone_numbers)} contacts',
        'success_count': success_count
    })