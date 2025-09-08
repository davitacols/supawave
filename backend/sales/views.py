from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from accounts.models import Business
from .models import Sale, SaleItem
from .serializers import SaleSerializer
from notifications.utils import create_sale_milestone
from inventory.models import Product
from .receipt_generator import generate_receipt_data

from utils.business_utils import get_user_business

@api_view(['GET', 'POST'])
def sales(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        sales = Sale.objects.filter(business=business).order_by('-created_at')
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        try:
            print(f"Request data: {request.data}")
            
            # Check if all products exist
            if 'items' in request.data:
                missing_products = []
                for item in request.data['items']:
                    product_id = item.get('product')
                    if product_id and not Product.objects.filter(id=product_id, business=business).exists():
                        missing_products.append(product_id)
                
                if missing_products:
                    return Response({
                        'error': 'Products not found',
                        'missing_products': missing_products,
                        'message': 'Please create these products first in inventory'
                    }, status=400)
            
            serializer = SaleSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                # Auto-assign store based on user role
                store = None
                if request.user.role == 'manager':
                    # Manager - find their assigned store
                    from stores.models import Store
                    store = Store.objects.filter(business=business, manager_user=request.user).first()
                elif request.user.role == 'owner':
                    # Owner - assign to main store by default
                    from stores.models import Store
                    store = Store.objects.filter(business=business, is_main_store=True).first()
                
                sale = serializer.save(business=business, store=store)
                
                # Check for sales milestones
                total_sales = Sale.objects.filter(business=business).aggregate(
                    total=Sum('total_amount')
                )['total'] or 0
                
                milestones = [100000, 500000, 1000000, 5000000]  # ₦100k, ₦500k, ₦1M, ₦5M
                for milestone in milestones:
                    if total_sales >= milestone and (total_sales - sale.total_amount) < milestone:
                        create_sale_milestone(business, milestone)
                        break
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Exception: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def sales_analytics(request):
    business = get_user_business(request.user)
    now = timezone.now()
    
    # Daily revenue (last 7 days)
    daily_revenue = []
    for i in range(7):
        date = now - timedelta(days=i)
        revenue = Sale.objects.filter(
            business=business,
            created_at__date=date.date()
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        daily_revenue.append({
            'date': date.strftime('%Y-%m-%d'),
            'revenue': float(revenue)
        })
    
    # Top selling products (last 30 days)
    top_products = SaleItem.objects.filter(
        sale__business=business,
        sale__created_at__gte=now - timedelta(days=30)
    ).values('product__name').annotate(
        total_sold=Sum('quantity')
    ).order_by('-total_sold')[:5]
    
    # Monthly stats
    monthly_revenue = Sale.objects.filter(
        business=business,
        created_at__month=now.month,
        created_at__year=now.year
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    monthly_sales_count = Sale.objects.filter(
        business=business,
        created_at__month=now.month,
        created_at__year=now.year
    ).count()
    
    return Response({
        'daily_revenue': daily_revenue,
        'top_products': list(top_products),
        'monthly_revenue': float(monthly_revenue),
        'monthly_sales_count': monthly_sales_count
    })

@api_view(['GET'])
def get_receipt(request, sale_id):
    business = get_user_business(request.user)
    try:
        sale = Sale.objects.get(id=sale_id, business=business)
        receipt_data = generate_receipt_data(sale, business)
        return Response(receipt_data)
    except Sale.DoesNotExist:
        return Response({'error': 'Sale not found'}, status=404)