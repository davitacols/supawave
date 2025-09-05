from rest_framework import serializers
from .models import WhatsAppConfig, WhatsAppTemplate, WhatsAppMessage

class WhatsAppConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppConfig
        fields = ['id', 'phone_number', 'api_token', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'api_token': {'write_only': True}}

class WhatsAppTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppTemplate
        fields = ['id', 'name', 'template_type', 'message', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class WhatsAppMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppMessage
        fields = ['id', 'phone_number', 'message', 'status', 'sent_at', 'created_at']
        read_only_fields = ['id', 'status', 'sent_at', 'created_at']