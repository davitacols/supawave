from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .ollama_service import AIService

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_with_ai(request):
    """Chat endpoint for business assistant"""
    try:
        message = request.data.get('message', '').strip()
        if not message:
            return Response(
                {'error': 'Message is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        business = request.user.business
        ai_service = AIService()
        
        response = ai_service.chat(message, business)
        
        return Response({
            'message': message,
            'response': response,
            'timestamp': request.data.get('timestamp')
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )