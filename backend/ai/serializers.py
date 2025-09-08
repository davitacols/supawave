from rest_framework import serializers
from .models import BusinessInsight, AICoachSession, MarketIntelligence

class BusinessInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessInsight
        fields = [
            'id', 'insight_type', 'priority', 'title', 'message',
            'action_required', 'is_read', 'created_at', 'expires_at',
            'confidence_score', 'data_sources'
        ]

class AICoachSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AICoachSession
        fields = [
            'id', 'query', 'response', 'language', 'session_type',
            'created_at', 'was_helpful', 'feedback'
        ]

class MarketIntelligenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketIntelligence
        fields = [
            'id', 'product_name', 'category', 'region',
            'avg_price', 'min_price', 'max_price', 'sample_size',
            'price_trend', 'demand_level', 'last_updated'
        ]