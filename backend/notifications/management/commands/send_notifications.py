from django.core.management.base import BaseCommand
from django.db import models
from notifications.tasks import check_low_stock_alerts, send_daily_reports

class Command(BaseCommand):
    help = 'Send email notifications for low stock and daily reports'

    def add_arguments(self, parser):
        parser.add_argument('--type', choices=['low_stock', 'daily_report', 'all'], default='all')

    def handle(self, *args, **options):
        notification_type = options['type']
        
        if notification_type in ['low_stock', 'all']:
            self.stdout.write('Checking low stock alerts...')
            check_low_stock_alerts()
            self.stdout.write(self.style.SUCCESS('Low stock alerts sent'))
        
        if notification_type in ['daily_report', 'all']:
            self.stdout.write('Sending daily reports...')
            send_daily_reports()
            self.stdout.write(self.style.SUCCESS('Daily reports sent'))