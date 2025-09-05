from accounts.models import Business
from rest_framework.exceptions import PermissionDenied

def get_user_business(user):
    """Get business for any user type (owner or staff)"""
    if hasattr(user, 'business') and user.business:
        return user.business
    
    try:
        return Business.objects.get(owner=user)
    except Business.DoesNotExist:
        raise PermissionDenied("User has no associated business. Please contact support.")