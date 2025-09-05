from django.urls import path
from . import views

urlpatterns = [
    path('config/', views.WhatsAppConfigView.as_view(), name='whatsapp-config'),
    path('templates/', views.WhatsAppTemplateListView.as_view(), name='whatsapp-templates'),
    path('messages/', views.WhatsAppMessageListView.as_view(), name='whatsapp-messages'),
    path('send-promotion/', views.send_promotion, name='send-promotion'),
]