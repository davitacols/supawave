from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get('email')
        
        try:
            user = User.objects.filter(email=username).first()
            if user and user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
        
        return None