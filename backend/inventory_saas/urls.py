from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/invoices/', include('invoices.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/whatsapp/', include('whatsapp.urls')),
    path('api/sync/', include('sync.urls')),
    path('api/', include('stores.urls')),
    path('api/payments/', include('payments.urls')),

    path('api/credit/', include('credit.urls')),
    path('api/exports/', include('exports.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/marketplace/', include('marketplace.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)