import boto3
from django.conf import settings
from django.template.loader import render_to_string
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.ses_client = boto3.client(
            'ses',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_SES_REGION_NAME
        )
        self.from_email = settings.FROM_EMAIL

    def send_low_stock_alert(self, business_email, products):
        subject = f"⚠️ Low Stock Alert - {len(products)} products need attention"
        
        html_content = f"""
        <h2>Low Stock Alert</h2>
        <p>The following products are running low:</p>
        <ul>
        {''.join([f'<li><strong>{p.name}</strong> - Only {p.stock_quantity} left (Alert at {p.low_stock_threshold})</li>' for p in products])}
        </ul>
        <p>Please restock these items soon to avoid stockouts.</p>
        """
        
        return self._send_email(business_email, subject, html_content)

    def send_daily_report(self, business_email, report_data):
        subject = f"📊 Daily Sales Report - {report_data['date']}"
        
        html_content = f"""
        <h2>Daily Sales Report</h2>
        <p><strong>Date:</strong> {report_data['date']}</p>
        <p><strong>Total Sales:</strong> ₦{report_data['total_sales']:,}</p>
        <p><strong>Orders:</strong> {report_data['total_orders']}</p>
        <p><strong>Top Product:</strong> {report_data['top_product']}</p>
        <p><strong>Low Stock Items:</strong> {report_data['low_stock_count']}</p>
        """
        
        return self._send_email(business_email, subject, html_content)

    def _send_email(self, to_email, subject, html_content):
        try:
            response = self.ses_client.send_email(
                Source=self.from_email,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': {
                        'Html': {'Data': html_content, 'Charset': 'UTF-8'},
                        'Text': {'Data': html_content.replace('<br>', '\n'), 'Charset': 'UTF-8'}
                    }
                }
            )
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except ClientError as e:
            logger.error(f"Failed to send email: {e}")
            return False