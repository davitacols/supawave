from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from .services import ExportService

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_products(request):
    return ExportService.export_products_csv(request.user.business)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_sales(request):
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if start_date:
        start_date = parse_date(start_date)
    if end_date:
        end_date = parse_date(end_date)
    
    return ExportService.export_sales_csv(request.user.business, start_date, end_date)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_inventory_report(request):
    return ExportService.export_inventory_report_csv(request.user.business)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_data(request):
    return ExportService.backup_business_data(request.user.business)