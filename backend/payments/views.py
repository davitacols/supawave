from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import SubscriptionPlan, Subscription, Payment
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer, PaymentSerializer
from .services import PaystackService, SubscriptionService
import uuid

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Subscription.objects.filter(business=self.request.user.business)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        try:
            subscription = Subscription.objects.get(business=request.user.business)
            serializer = self.get_serializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response({'error': 'No subscription found'}, status=404)
    
    @action(detail=True, methods=['post'])
    def upgrade(self, request, pk=None):
        subscription = self.get_object()
        plan_id = request.data.get('plan_id')
        
        try:
            new_plan = SubscriptionPlan.objects.get(id=plan_id)
            updated_subscription = SubscriptionService.upgrade_subscription(subscription, new_plan)
            serializer = self.get_serializer(updated_subscription)
            return Response(serializer.data)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(business=self.request.user.business)
    
    def perform_create(self, serializer):
        serializer.save(
            business=self.request.user.business,
            reference=str(uuid.uuid4())
        )
    
    @action(detail=False, methods=['post'])
    def initialize_paystack(self, request):
        amount = request.data.get('amount')
        email = request.user.email
        
        # Create payment record
        payment = Payment.objects.create(
            business=request.user.business,
            amount=amount,
            method='paystack',
            reference=str(uuid.uuid4())
        )
        
        # Initialize Paystack payment
        result = PaystackService.initialize_payment(email, float(amount), payment.reference)
        
        if result.get('status'):
            payment.paystack_reference = result['data']['reference']
            payment.save()
            return Response({
                'status': True,
                'data': {
                    'payment_id': payment.id,
                    'authorization_url': result['data']['authorization_url'],
                    'reference': result['data']['reference']
                }
            })
        
        return Response({'error': 'Payment initialization failed', 'details': result}, status=400)
    
    @action(detail=False, methods=['post'])
    def verify_paystack(self, request):
        reference = request.data.get('reference')
        
        try:
            payment = Payment.objects.get(paystack_reference=reference)
            result = PaystackService.verify_payment(reference)
            
            if result.get('status') and result['data']['status'] == 'success':
                payment.status = 'completed'
                payment.save()
                
                # Update subscription if this was a subscription payment
                if payment.subscription:
                    payment.subscription.status = 'active'
                    payment.subscription.end_date = timezone.now() + timezone.timedelta(days=30)
                    payment.subscription.save()
                
                return Response({'status': 'success', 'payment': PaymentSerializer(payment).data})
            
            payment.status = 'failed'
            payment.save()
            return Response({'status': 'failed'}, status=400)
            
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=404)
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        try:
            subscription = Subscription.objects.get(business=request.user.business)
            days_remaining = (subscription.end_date - timezone.now().date()).days if subscription.end_date else 0
            
            return Response({
                'plan': subscription.plan.name,
                'status': subscription.status,
                'days_remaining': max(0, days_remaining),
                'auto_renew': subscription.auto_renew,
                'end_date': subscription.end_date
            })
        except Subscription.DoesNotExist:
            return Response({'status': 'no_subscription'})
    
    @action(detail=False, methods=['post'])
    def cancel(self, request):
        try:
            subscription = Subscription.objects.get(business=request.user.business)
            subscription.auto_renew = False
            subscription.save()
            return Response({'status': 'cancelled'})
        except Subscription.DoesNotExist:
            return Response({'error': 'No subscription found'}, status=404)
    
    @action(detail=False, methods=['post'])
    def test_paystack(self, request):
        """Test Paystack integration"""
        try:
            result = PaystackService.initialize_payment(
                email=request.user.email,
                amount=5000,  # ₦50 test amount
                reference=f"test_{str(uuid.uuid4())[:8]}"
            )
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=400)