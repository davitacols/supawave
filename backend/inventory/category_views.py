from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from accounts.models import Business
from .models import Category, Supplier
from .serializers import CategorySerializer, SupplierSerializer

def get_user_business(user):
    return Business.objects.get(owner=user)

@api_view(['DELETE'])
def category_detail(request, pk):
    try:
        business = get_user_business(request.user)
        category = Category.objects.get(pk=pk, business=business)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)

@api_view(['DELETE'])
def supplier_detail(request, pk):
    try:
        business = get_user_business(request.user)
        supplier = Supplier.objects.get(pk=pk, business=business)
        supplier.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Supplier.DoesNotExist:
        return Response({'error': 'Supplier not found'}, status=404)