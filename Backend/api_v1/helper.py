import random
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail


from django.core.mail import send_mail

def send_email_otp(user, otp_code):
    subject = "Your OTP Code"
    message = f"Your OTP code is: {otp_code}"
    from_email = 'Shekhar@acem.edu.in'
    recipient_list = [user.email]
    send_mail(subject, message, from_email, recipient_list)

