from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from accounts.models import Business
from .models import Customer, Invoice
from .serializers import CustomerSerializer, InvoiceSerializer
from datetime import datetime

def get_user_business(user):
    return Business.objects.get(owner=user)

@api_view(['GET', 'POST'])
def customers(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        customers = Customer.objects.filter(business=business)
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CustomerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(business=business)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def invoices(request):
    business = get_user_business(request.user)
    
    if request.method == 'GET':
        invoices = Invoice.objects.filter(business=business).order_by('-created_at')
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        try:
            # Generate invoice number
            year = datetime.now().year
            count = Invoice.objects.filter(business=business).count() + 1
            invoice_number = f"INV-{year}-{count:04d}"
            
            data = request.data.copy()
            data['invoice_number'] = invoice_number
            
            print(f"Invoice data: {data}")
            
            serializer = InvoiceSerializer(data=data)
            if serializer.is_valid():
                serializer.save(business=business)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Invoice creation error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
def invoice_detail(request, pk):
    business = get_user_business(request.user)
    try:
        invoice = Invoice.objects.get(pk=pk, business=business)
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=404)
    
    if request.method == 'GET':
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = InvoiceSerializer(invoice, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)