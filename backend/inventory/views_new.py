from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from accounts.models import Business
from .models_new import Category, Supplier, Product
from .serializers_new import CategorySerializer, SupplierSerializer, ProductSerializer

def get_user_business(user):
    return Business.objects.get(owner=user)

class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        queryset = Product.objects.filter(business=business, is_active=True)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(barcode__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        business = get_user_business(self.request.user)
        serializer.save(business=business)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        return Product.objects.filter(business=business)
    
    def perform_destroy(self, instance):
        # Soft delete
        instance.is_active = False
        instance.save()

class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        return Category.objects.filter(business=business).order_by('name')
    
    def perform_create(self, serializer):
        business = get_user_business(self.request.user)
        serializer.save(business=business)

class SupplierListCreateView(generics.ListCreateAPIView):
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        return Supplier.objects.filter(business=business).order_by('name')
    
    def perform_create(self, serializer):
        business = get_user_business(self.request.user)
        serializer.save(business=business)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def low_stock_products(request):
    business = get_user_business(request.user)
    products = Product.objects.filter(
        business=business,
        is_active=True,
        stock_quantity__lte=models.F('low_stock_threshold')
    )
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)