
import requests
from urllib.parse import urlencode
from django.conf import settings
from django.core.cache import cache
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)



def send_membership_otp(phone: str,membership_id: str,membership_type: str):
    # message = f"Welcome to IETE Membership Registration. Your OTP is {otp}, valid for {settings.OTP_EXPIRY_SECONDS} minutes."
    message=f"Congratulations, You have been successfully granted IETE Membership as {membership_type}. Your Membership number is {membership_id}."
    template_id = settings.SMS_API_CONFIG["MEMBERSHIP_TEMPLATE_ID"]
    return _send_sms(phone, message, template_id)

def send_verification_otp(phone: str, otp: str):
    message = f"Welcome to IETE Membership Registration. Your OTP is {otp}, valid for 5 minutes."
    template_id = settings.SMS_API_CONFIG["TEMPLATE_ID"]
    return _send_sms(phone, message, template_id)

def _send_sms(phone: str, message: str,template_id: str = None):
    config = settings.SMS_API_CONFIG
    base_url = config["BASE_URL"]
    

    params = {
        "UserID": config["USER_ID"],
        "Password": config["PASSWORD"],
        "SenderID": config["SENDER_ID"],
        "Phno": phone,
        "Msg": message,
        "EntityID": config["ENTITY_ID"],
        "TemplateID": template_id,
    }
    if config.get("DLR_URL"):
        params["DlrUrl"] = config["DLR_URL"]

    url = f"{base_url}?{urlencode(params)}"

    session = requests.Session()
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session.mount('http://', HTTPAdapter(max_retries=retries))

    try:
        response = session.get(url, timeout=10)
        response.raise_for_status()
        try:
            return response.json()
        except Exception:
            return {"status": "ok", "message": response.text}
    except requests.RequestException as e:
        logger.exception(f"SMS send error to {phone}: {e}")
        return {"status": "error", "message": str(e)}

def get_otp_from_cache(phone: str):
    return cache.get(f"otp:{phone}")

def set_otp_in_cache(phone: str, otp: str):
    cache.set(f"otp:{phone}", otp, timeout=settings.OTP_EXPIRY_SECONDS)

def clear_otp_cache(phone: str):
    cache.delete(f"otp:{phone}")

