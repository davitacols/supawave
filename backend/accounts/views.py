from rest_framework import status, generics, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Business
from .serializers import UserRegistrationSerializer, LoginSerializer, BusinessSerializer, StaffSerializer

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'business_id': user.business.id
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'business_id': user.business.id if user.business else None
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BusinessDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.business

class StaffListCreateView(generics.ListCreateAPIView):
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(
            business=self.request.user.business,
            role__in=['manager', 'cashier']
        ).order_by('first_name', 'last_name')
    
    def create(self, request, *args, **kwargs):
        print(f"Staff creation request data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        if self.request.user.role not in ['owner', 'manager']:
            raise permissions.PermissionDenied("Only owners and managers can add staff")
        
        # Check if username already exists globally
        username = serializer.validated_data.get('username')
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
            
        serializer.save()

class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(business=self.request.user.business)
    
    def perform_update(self, serializer):
        if self.request.user.role not in ['owner', 'manager']:
            raise permissions.PermissionDenied("Only owners and managers can edit staff")
        serializer.save()
    
    def perform_destroy(self, instance):
        if self.request.user.role != 'owner':
            raise permissions.PermissionDenied("Only owners can delete staff")
        instance.is_active_staff = False
        instance.save()