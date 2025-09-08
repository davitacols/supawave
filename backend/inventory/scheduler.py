from django_crontab import crontab
from django.conf import settings

# Crontab schedule for daily stock take
# Runs every day at 11:59 PM
CRONJOBS = [
    ('59 23 * * *', 'inventory.tasks.daily_stocktake_task', '>> /tmp/daily_stocktake.log 2>&1'),
]

# Alternative: Using APScheduler for more flexibility
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.core.management import call_command
import atexit

def start_scheduler():
    """
    Start the background scheduler for automatic stock taking
    """
    scheduler = BackgroundScheduler()
    
    # Schedule daily stock take at 11:59 PM
    scheduler.add_job(
        func=run_daily_stocktake,
        trigger=CronTrigger(hour=23, minute=59),
        id='daily_stocktake',
        name='Daily Stock Take',
        replace_existing=True
    )
    
    scheduler.start()
    
    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())

def run_daily_stocktake():
    """
    Function to run the daily stock take command
    """
    try:
        call_command('daily_stocktake')
        print(f'Daily stocktake completed at {timezone.now()}')
    except Exception as e:
        print(f'Daily stocktake failed: {str(e)}')