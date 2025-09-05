from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, F
from accounts.models import Business
from .models import Category, Supplier, Product
from .serializers import CategorySerializer, SupplierSerializer, ProductSerializer
from .serializers_fast import FastProductSerializer

from utils.business_utils import get_user_business

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def products(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        queryset = Product.objects.filter(business=business).select_related('category', 'supplier')
        
        # Search functionality
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(barcode__icontains=search)
            )
        
        # Category filter
        category = request.query_params.get('category')
        if category and category != 'all':
            queryset = queryset.filter(category__name=category)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        offset = (page - 1) * page_size
        
        # Use fast serializer for listing
        fast_mode = request.query_params.get('fast', 'true')
        if fast_mode == 'true':
            products = Product.objects.filter(business=business).select_related('category').only(
                'id', 'name', 'sku', 'selling_price', 'stock_quantity', 'low_stock_threshold', 'category__name'
            ).order_by('-created_at')[offset:offset + page_size]
            total_count = Product.objects.filter(business=business).count()
            serializer = FastProductSerializer(products, many=True)
        else:
            products = queryset.order_by('-created_at')[offset:offset + page_size]
            total_count = queryset.count()
            serializer = ProductSerializer(products, many=True)
        
        return Response({
            'results': serializer.data,
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })
    
    elif request.method == 'POST':
        print(f"Product creation data: {request.data}")
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(business=business)
            return Response(serializer.data, status=201)
        print(f"Product creation errors: {serializer.errors}")
        return Response(serializer.errors, status=400)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        business = get_user_business(self.request.user)
        return Product.objects.filter(business=business)
    
    def perform_destroy(self, instance):
        # Hard delete
        instance.delete()

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def categories(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        categories = Category.objects.filter(business=business).order_by('name')
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(business=business)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def suppliers(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        suppliers = Supplier.objects.filter(business=business).order_by('name')
        serializer = SupplierSerializer(suppliers, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SupplierSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(business=business)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def low_stock_products(request):
    business = get_user_business(request.user)
    products = Product.objects.filter(
        business=business,
        stock_quantity__lte=F('low_stock_threshold')
    )
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def barcode_lookup(request, barcode):
    business = get_user_business(request.user)
    
    try:
        product = Product.objects.get(barcode=barcode, business=business)
        serializer = ProductSerializer(product)
        return Response({
            'found': True,
            'product': serializer.data
        })
    except Product.DoesNotExist:
        return Response({
            'found': False,
            'barcode': barcode,
            'message': 'Product not found'
        })