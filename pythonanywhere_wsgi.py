import os
import sys

# Add your project directory to sys.path
path = '/home/yourusername/supawave/backend'
if path not in sys.path:
    sys.path.insert(0, path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'inventory_saas.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()