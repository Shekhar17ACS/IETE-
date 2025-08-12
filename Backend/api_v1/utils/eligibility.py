# yourapp/utils/eligibility.py
from datetime import date

# Define your academic buckets
VALID_QUALIFICATIONS = {
    "AMIETE",
    "BE",
    "B.Tech",
    "B.Sc",
    "ME",
    "M.Tech",
    "MS",
    "M.Sc",
    "Ph.D.",
    "D.Sc",
    "D.Eng",

    # … add any others your governing council recognizes …
}

def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

def total_experience_years(experiences):
    """Sum up (end_date – start_date) in years, rounding down."""
    total_days = 0
    for exp in experiences:
        end = exp.end_date or date.today()
        total_days += (end - exp.start_date).days
    return total_days // 365

def has_valid_academic(qualifications):
    """Return True if user has at least one qualification in our VALID_QUALIFICATIONS set."""
    for q in qualifications:
        name = q.qualification_type.name.upper()
        if name in (word.upper() for word in VALID_QUALIFICATIONS):
            return True
    return False
