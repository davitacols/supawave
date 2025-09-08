from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Business
from datetime import datetime, timedelta

class StaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    permissions = serializers.JSONField(required=False)
    profile_image = serializers.ImageField(required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone_number', 'role', 'is_active_staff', 'password', 'permissions', 'profile_image']
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.profile_image:
            request = self.context.get('request')
            if request:
                data['profile_image'] = request.build_absolute_uri(instance.profile_image.url)
        return data
        
    def validate_role(self, value):
        if value not in ['manager', 'cashier']:
            raise serializers.ValidationError("Staff can only be assigned 'manager' or 'cashier' roles.")
        return value
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        permissions = validated_data.pop('permissions', {})
        
        # Create user without password first
        user = User(**validated_data)
        user.set_password(password)
        user.business = self.context['request'].user.business
        user.created_by = self.context['request'].user
        user.is_active_staff = True
        user.save()
        
        return user
        
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        permissions = validated_data.pop('permissions', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance

class BusinessSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False)
    subscription_status = serializers.SerializerMethodField()
    trial_days_left = serializers.SerializerMethodField()
    
    class Meta:
        model = Business
        fields = ['id', 'name', 'address', 'phone', 'email', 'registration_date', 'is_active', 'logo', 'primary_color', 'secondary_color', 'subscription_status', 'trial_days_left']
    
    def get_subscription_status(self, obj):
        from datetime import datetime
        if hasattr(obj, 'trial_end_date') and obj.trial_end_date:
            if hasattr(obj.trial_end_date, 'date'):
                trial_date = obj.trial_end_date.date()
            else:
                trial_date = obj.trial_end_date
            
            if trial_date >= datetime.now().date():
                return 'trial'
            else:
                return 'expired'
        return 'active'
    
    def get_trial_days_left(self, obj):
        from datetime import datetime
        if hasattr(obj, 'trial_end_date') and obj.trial_end_date:
            if hasattr(obj.trial_end_date, 'date'):
                trial_date = obj.trial_end_date.date()
            else:
                trial_date = obj.trial_end_date
            days_left = (trial_date - datetime.now().date()).days
            return max(0, days_left)
        return None
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            request = self.context.get('request')
            if request:
                data['logo'] = request.build_absolute_uri(instance.logo.url)
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    business_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'business_name']
    
    def create(self, validated_data):
        business_name = validated_data.pop('business_name')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.role = 'owner'
        user.save()
        
        business = Business.objects.create(
            name=business_name,
            owner=user,
            trial_end_date=datetime.now().date() + timedelta(days=14)
        )
        user.business = business
        user.save()
        
        # Create main store (head office) automatically
        from stores.models import Store
        Store.objects.create(
            business=business,
            name=f"{business_name} - Head Office",
            address="Main office location",
            is_main_store=True,
            is_active=True
        )
        
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField()
    
    def validate(self, data):
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        
        if not (email or username):
            raise serializers.ValidationError("Must include email or username.")
        
        if not password:
            raise serializers.ValidationError("Must include password.")
        
        # Try to authenticate with email first, then username
        user = None
        if email:
            user = authenticate(username=email, password=password)
        if not user and username:
            user = authenticate(username=username, password=password)
            
        if user:
            if user.is_active:
                return user
            else:
                raise serializers.ValidationError("User account is disabled.")
        else:
            raise serializers.ValidationError("Unable to log in with provided credentials.")