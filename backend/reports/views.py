import csv
from datetime import datetime, timedelta
from django.http import HttpResponse
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from sales.models import Sale, SaleItem
from inventory.models import Product
from accounts.models import Business

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_report(request):
    business = request.user.business
    date = request.GET.get('date', timezone.now().date())
    
    if isinstance(date, str):
        date = datetime.strptime(date, '%Y-%m-%d').date()
    
    sales = Sale.objects.filter(
        business=business,
        created_at__date=date
    )
    
    data = {
        'date': date,
        'total_sales': sales.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
        'total_transactions': sales.count(),
        'items_sold': SaleItem.objects.filter(sale__in=sales).aggregate(Sum('quantity'))['quantity__sum'] or 0,
        'sales_list': [{
            'id': sale.id,
            'time': sale.created_at.strftime('%H:%M'),
            'total': sale.total_amount,
            'items': sale.items.count(),
            'customer': sale.customer_phone or 'Walk-in',
            'items_detail': [{
                'product': item.product.name,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'total_price': item.total_price
            } for item in sale.items.all()]
        } for sale in sales.order_by('-created_at')]
    }
    
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_report(request):
    business = request.user.business
    month = request.GET.get('month', timezone.now().month)
    year = request.GET.get('year', timezone.now().year)
    
    sales = Sale.objects.filter(
        business=business,
        created_at__month=month,
        created_at__year=year
    )
    
    # Daily breakdown
    daily_sales = {}
    for sale in sales:
        day = sale.created_at.date()
        if day not in daily_sales:
            daily_sales[day] = {'total': 0, 'count': 0}
        daily_sales[day]['total'] += sale.total_amount
        daily_sales[day]['count'] += 1
    
    data = {
        'month': month,
        'year': year,
        'total_sales': sales.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
        'total_transactions': sales.count(),
        'daily_breakdown': [
            {
                'date': date,
                'total': daily_sales[date]['total'],
                'transactions': daily_sales[date]['count']
            } for date in sorted(daily_sales.keys())
        ]
    }
    
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def yearly_report(request):
    business = request.user.business
    year = request.GET.get('year', timezone.now().year)
    
    sales = Sale.objects.filter(
        business=business,
        created_at__year=year
    )
    
    # Monthly breakdown
    monthly_sales = {}
    for i in range(1, 13):
        monthly_sales[i] = {'total': 0, 'count': 0}
    
    for sale in sales:
        month = sale.created_at.month
        monthly_sales[month]['total'] += sale.total_amount
        monthly_sales[month]['count'] += 1
    
    data = {
        'year': year,
        'total_sales': sales.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
        'total_transactions': sales.count(),
        'monthly_breakdown': [
            {
                'month': month,
                'month_name': datetime(year, month, 1).strftime('%B'),
                'total': monthly_sales[month]['total'],
                'transactions': monthly_sales[month]['count']
            } for month in range(1, 13)
        ]
    }
    
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_daily_csv(request):
    business = request.user.business
    date = request.GET.get('date', timezone.now().date())
    
    if isinstance(date, str):
        date = datetime.strptime(date, '%Y-%m-%d').date()
    
    sales = Sale.objects.filter(
        business=business,
        created_at__date=date
    ).order_by('-created_at')
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="daily_report_{date}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Time', 'Sale ID', 'Customer', 'Product ID', 'Product SKU', 'Product Name', 'Quantity', 'Unit Price', 'Item Total', 'Sale Total'])
    
    for sale in sales:
        sale_items = sale.items.all()
        if sale_items:
            for item in sale_items:
                writer.writerow([
                    sale.created_at.strftime('%H:%M:%S'),
                    f"'{sale.id}",
                    sale.customer_phone or 'Walk-in',
                    f"'{item.product.id}",
                    getattr(item.product, 'sku', '') or f"'{item.product.id}",
                    item.product.name,
                    item.quantity,
                    f"{item.unit_price:.2f}",
                    f"{item.total_price:.2f}",
                    f"{sale.total_amount:.2f}"
                ])
        else:
            writer.writerow([
                sale.created_at.strftime('%H:%M:%S'),
                f"'{sale.id}",
                sale.customer_phone or 'Walk-in',
                '',
                '',
                'No items',
                0,
                '0.00',
                '0.00',
                f"{sale.total_amount:.2f}"
            ])
    
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_monthly_csv(request):
    business = request.user.business
    month = int(request.GET.get('month', timezone.now().month))
    year = int(request.GET.get('year', timezone.now().year))
    
    sales = Sale.objects.filter(
        business=business,
        created_at__month=month,
        created_at__year=year
    ).order_by('-created_at')
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="monthly_report_{year}_{month:02d}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Date', 'Time', 'Sale ID', 'Customer', 'Total Amount', 'Items Count'])
    
    for sale in sales:
        writer.writerow([
            sale.created_at.strftime('%Y-%m-%d'),
            sale.created_at.strftime('%H:%M:%S'),
            f"'{sale.id}",
            sale.customer_phone or 'Walk-in',
            f"{sale.total_amount:.2f}",
            sale.items.count()
        ])
    
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_yearly_csv(request):
    business = request.user.business
    year = int(request.GET.get('year', timezone.now().year))
    
    sales = Sale.objects.filter(
        business=business,
        created_at__year=year
    ).order_by('-created_at')
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="yearly_report_{year}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Date', 'Time', 'Sale ID', 'Customer', 'Total Amount', 'Items Count'])
    
    for sale in sales:
        writer.writerow([
            sale.created_at.strftime('%Y-%m-%d'),
            sale.created_at.strftime('%H:%M:%S'),
            f"'{sale.id}",
            sale.customer_phone or 'Walk-in',
            f"{sale.total_amount:.2f}",
            sale.items.count()
        ])
    
    return response