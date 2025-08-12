from datetime import datetime
from django.db.models import Count  
from ..models import Payment
import random

def generate_receipt_number():
    now = datetime.now()
    current_year = now.year
    current_month_letter = now.strftime("%b")[0].upper()

    yearly_count = Payment.objects.filter(created_at__year=current_year).count()
    next_number = yearly_count + 1

    padded_number = str(next_number).zfill(5)
    return f"{current_month_letter}{padded_number}"


def generate_otp(length=6):
    return ''.join(str(random.randint(0, 9)) for _ in range(length))

