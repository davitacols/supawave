from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import generics
from .email_service import EmailService
from .tasks import check_low_stock_alerts
from .models import Notification
from .serializers import NotificationSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_test_email(request):
    """Send a test email to verify SES configuration"""
    email_service = EmailService()
    business = request.user.business
    
    success = email_service._send_email(
        business.email,
        "SupaWave Test Email",
        "<h2>Test Email</h2><p>Your AWS SES integration is working correctly!</p>"
    )
    
    return Response({'success': success})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_low_stock_alert(request):
    """Manually trigger low stock alert for current business"""
    check_low_stock_alerts()
    return Response({'message': 'Low stock alerts sent'})

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            business=self.request.user.business
        ).order_by('-created_at')[:20]