from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .rekognition_service import RekognitionService
from .models import Product
import io

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_product_image(request):
    """Analyze uploaded image and return category suggestions"""
    if 'image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    image_file = request.FILES['image']
    
    try:
        rekognition = RekognitionService()
        image_bytes = image_file.read()
        
        # Get image analysis
        analysis = rekognition.analyze_product_image(image_bytes)
        
        # Get text from image
        text_detections = rekognition.detect_text_in_image(image_bytes)
        
        if analysis:
            return Response({
                'suggested_category': analysis['suggested_category'],
                'labels': analysis['labels'],
                'confidence_scores': analysis['confidence_scores'],
                'detected_text': text_detections
            })
        else:
            return Response({'error': 'Failed to analyze image'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_duplicate_products(request):
    """Check if uploaded image matches existing products"""
    if 'image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    image_file = request.FILES['image']
    try:
        business = request.user.businesses.first()
        if not business:
            return Response({'error': 'No business found for user'}, status=status.HTTP_400_BAD_REQUEST)
    except AttributeError:
        return Response({'error': 'User has no business'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        rekognition = RekognitionService()
        new_image_bytes = image_file.read()
        
        # Get existing products with images
        existing_products = Product.objects.filter(
            business=business,
            image__isnull=False
        ).exclude(image='')
        
        duplicates = []
        
        for product in existing_products[:10]:  # Limit to 10 for free tier
            try:
                with product.image.open('rb') as existing_image:
                    existing_image_bytes = existing_image.read()
                    
                is_duplicate, similarity = rekognition.compare_images(
                    new_image_bytes, existing_image_bytes
                )
                
                if is_duplicate:
                    duplicates.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'similarity': similarity
                    })
            except Exception:
                continue
        
        return Response({
            'duplicates_found': len(duplicates) > 0,
            'duplicates': duplicates
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)