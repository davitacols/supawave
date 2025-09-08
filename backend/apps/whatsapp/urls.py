from django.urls import path
from . import views

urlpatterns = [
    path('connect/', views.connect_whatsapp, name='whatsapp_connect'),
    path('send/', views.send_message, name='whatsapp_send'),
    path('config/', views.get_config, name='whatsapp_config'),
    path('messages/', views.get_messages, name='whatsapp_messages'),
]