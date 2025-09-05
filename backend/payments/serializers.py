from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, Payment

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_price = serializers.DecimalField(source='plan.price', max_digits=10, decimal_places=2, read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = '__all__'
        
    def get_days_remaining(self, obj):
        from django.utils import timezone
        if obj.status == 'trial':
            return max(0, (obj.trial_end_date - timezone.now()).days)
        return max(0, (obj.end_date - timezone.now()).days)

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('business', 'reference', 'paystack_reference')