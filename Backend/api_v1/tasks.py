from django.utils import timezone
from .models import Proposer
from django.core.mail import send_mail
from django.conf import settings

def auto_expire_proposers():
    now = timezone.now()
    expired = Proposer.objects.filter(status='pending', expiry_date__lt=now)
    for p in expired:
        p.status = 'expired'
        p.save()
        send_mail(
            "Membership Proposer Expired",
            f"Your proposer {p.name} did not respond in time. Status: expired.",
            settings.DEFAULT_FROM_EMAIL,
            [p.user.email]
        )
