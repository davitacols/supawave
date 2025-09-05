from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta
from .models import CreditCustomer, CreditSale, CreditPayment
from .serializers import CreditCustomerSerializer, CreditSaleSerializer, CreditPaymentSerializer
from utils.business_utils import get_user_business

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def credit_customers(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        customers = CreditCustomer.objects.filter(business=business, is_active=True)
        serializer = CreditCustomerSerializer(customers, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CreditCustomerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(business=business)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def credit_customer_detail(request, pk):
    business = get_user_business(request.user)
    
    try:
        customer = CreditCustomer.objects.get(id=pk, business=business)
    except CreditCustomer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=404)
    
    if request.method == 'GET':
        serializer = CreditCustomerSerializer(customer)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CreditCustomerSerializer(customer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def credit_sales(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        sales = CreditSale.objects.filter(business=business).order_by('-created_at')
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter == 'unpaid':
            sales = sales.filter(is_paid=False)
        elif status_filter == 'overdue':
            sales = sales.filter(is_paid=False, due_date__lt=timezone.now().date())
        
        serializer = CreditSaleSerializer(sales, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        
        # Check customer credit limit
        try:
            customer = CreditCustomer.objects.get(id=data['customer'], business=business)
            if customer.available_credit < float(data['total_amount']):
                return Response({'error': 'Credit limit exceeded'}, status=400)
        except CreditCustomer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)
        
        serializer = CreditSaleSerializer(data=data)
        if serializer.is_valid():
            credit_sale = serializer.save(business=business, created_by=request.user)
            
            # Update customer balance
            customer.current_balance += credit_sale.total_amount
            customer.save()
            
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_payment(request, sale_id):
    business = get_user_business(request.user)
    
    try:
        credit_sale = CreditSale.objects.get(id=sale_id, business=business)
    except CreditSale.DoesNotExist:
        return Response({'error': 'Credit sale not found'}, status=404)
    
    if credit_sale.is_paid:
        return Response({'error': 'Sale already paid'}, status=400)
    
    serializer = CreditPaymentSerializer(data=request.data)
    if serializer.is_valid():
        payment = serializer.save(credit_sale=credit_sale, created_by=request.user)
        
        # Update credit sale
        credit_sale.amount_paid += payment.amount
        if credit_sale.amount_paid >= credit_sale.total_amount:
            credit_sale.is_paid = True
        credit_sale.save()
        
        # Update customer balance
        credit_sale.customer.current_balance -= payment.amount
        credit_sale.customer.save()
        
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def credit_dashboard(request):
    business = get_user_business(request.user)
    
    # Total outstanding debt
    total_outstanding = CreditSale.objects.filter(
        business=business, is_paid=False
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Overdue amount
    overdue_amount = CreditSale.objects.filter(
        business=business, is_paid=False, due_date__lt=timezone.now().date()
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # This week's collections
    week_start = timezone.now().date() - timedelta(days=7)
    weekly_collections = CreditPayment.objects.filter(
        credit_sale__business=business, created_at__date__gte=week_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Active customers with debt
    customers_with_debt = CreditCustomer.objects.filter(
        business=business, current_balance__gt=0, is_active=True
    ).count()
    
    return Response({
        'total_outstanding': float(total_outstanding),
        'overdue_amount': float(overdue_amount),
        'weekly_collections': float(weekly_collections),
        'customers_with_debt': customers_with_debt
    })