from celery import shared_task
from django.core.management import call_command
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@shared_task
def daily_stocktake_task():
    """
    Celery task to run daily stock take for all businesses
    """
    try:
        call_command('daily_stocktake')
        logger.info(f'Daily stocktake completed at {timezone.now()}')
        return 'Daily stocktake completed successfully'
    except Exception as e:
        logger.error(f'Daily stocktake failed: {str(e)}')
        return f'Daily stocktake failed: {str(e)}'

@shared_task
def business_stocktake_task(business_id):
    """
    Celery task to run stock take for specific business
    """
    try:
        call_command('daily_stocktake', business_id=business_id)
        logger.info(f'Stocktake completed for business {business_id} at {timezone.now()}')
        return f'Stocktake completed for business {business_id}'
    except Exception as e:
        logger.error(f'Stocktake failed for business {business_id}: {str(e)}')
        return f'Stocktake failed for business {business_id}: {str(e)}'