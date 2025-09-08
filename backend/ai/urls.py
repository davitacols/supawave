from django.urls import path
from . import views, coach_views

urlpatterns = [
    path('chat/', views.chat_with_ai, name='ai_chat'),
    
    # AI Business Coach
    path('insights/', coach_views.get_business_insights, name='get_business_insights'),
    path('insights/generate/', coach_views.generate_insights, name='generate_insights'),
    path('insights/<uuid:insight_id>/dismiss/', coach_views.dismiss_insight, name='dismiss_insight'),
    path('insights/<uuid:insight_id>/read/', coach_views.mark_insight_read, name='mark_insight_read'),
    
    path('coach/ask/', coach_views.ask_ai_coach, name='ask_ai_coach'),
    path('coach/history/', coach_views.get_coach_history, name='get_coach_history'),
    
    path('market-intelligence/', coach_views.get_market_intelligence, name='get_market_intelligence'),
    path('market-intelligence/update/', coach_views.update_market_data, name='update_market_data'),
]