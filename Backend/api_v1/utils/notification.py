# utils/notifications.py

from django.core.mail import send_mail
from django.conf import settings
from api_v1.models import Notification



def notify_user(user, message,subject=None):
    Notification.objects.create(recipient=user, message=message)
    if user.email:
        send_mail(
            subject=subject or "Notification from Membership System",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True  
        )
        
        

def notify_users_for_role(role, message):
    users = role.roles.all()  
    for user in users:
        Notification.objects.create(
            recipient=user,
            message=message
        )

