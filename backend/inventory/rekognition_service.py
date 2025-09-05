import boto3
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class RekognitionService:
    def __init__(self):
        self.rekognition = boto3.client(
            'rekognition',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
    
    def analyze_product_image(self, image_bytes):
        """Analyze product image and return category suggestions and labels"""
        try:
            response = self.rekognition.detect_labels(
                Image={'Bytes': image_bytes},
                MaxLabels=10,
                MinConfidence=70
            )
            
            labels = [label['Name'] for label in response['Labels']]
            category = self._suggest_category(labels)
            
            return {
                'suggested_category': category,
                'labels': labels,
                'confidence_scores': {label['Name']: label['Confidence'] for label in response['Labels']}
            }
        except Exception as e:
            logger.error(f"Rekognition analysis failed: {e}")
            return None
    
    def detect_text_in_image(self, image_bytes):
        """Extract text from product labels/packaging"""
        try:
            response = self.rekognition.detect_text(
                Image={'Bytes': image_bytes}
            )
            
            text_detections = []
            for text in response['TextDetections']:
                if text['Type'] == 'LINE' and text['Confidence'] > 80:
                    text_detections.append(text['DetectedText'])
            
            return text_detections
        except Exception as e:
            logger.error(f"Text detection failed: {e}")
            return []
    
    def compare_images(self, source_image_bytes, target_image_bytes):
        """Compare two product images for similarity (duplicate detection)"""
        try:
            response = self.rekognition.compare_faces(
                SourceImage={'Bytes': source_image_bytes},
                TargetImage={'Bytes': target_image_bytes},
                SimilarityThreshold=80
            )
            
            if response['FaceMatches']:
                return True, response['FaceMatches'][0]['Similarity']
            
            # For products without faces, use label comparison
            source_labels = self.analyze_product_image(source_image_bytes)
            target_labels = self.analyze_product_image(target_image_bytes)
            
            if source_labels and target_labels:
                common_labels = set(source_labels['labels']) & set(target_labels['labels'])
                similarity = len(common_labels) / max(len(source_labels['labels']), len(target_labels['labels'])) * 100
                return similarity > 70, similarity
            
            return False, 0
        except Exception as e:
            logger.error(f"Image comparison failed: {e}")
            return False, 0
    
    def _suggest_category(self, labels):
        """Map Rekognition labels to product categories"""
        category_mapping = {
            'Food': ['Food', 'Bread', 'Fruit', 'Vegetable', 'Meat', 'Dairy', 'Snack', 'Candy'],
            'Beverages': ['Beverage', 'Drink', 'Bottle', 'Can', 'Soda', 'Water', 'Juice'],
            'Personal Care': ['Cosmetics', 'Shampoo', 'Soap', 'Toothbrush', 'Perfume'],
            'Household': ['Detergent', 'Cleaning', 'Tissue', 'Paper', 'Towel'],
            'Electronics': ['Electronics', 'Phone', 'Battery', 'Cable', 'Charger'],
            'Clothing': ['Clothing', 'Shirt', 'Pants', 'Shoe', 'Hat', 'Bag'],
            'Stationery': ['Book', 'Pen', 'Paper', 'Notebook', 'Pencil']
        }
        
        for category, keywords in category_mapping.items():
            if any(keyword in labels for keyword in keywords):
                return category
        
        return 'General'