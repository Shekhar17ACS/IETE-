
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.forms.models import model_to_dict
from django.utils.timezone import now
from .models import AuditLog
from .thread import get_request_user, get_request_ip
from datetime import date, datetime
from decimal import Decimal
import uuid

# ---------- Utility: Safe JSON serialization ----------
def safe_serialize(value):
    if isinstance(value, uuid.UUID):
        return str(value)
    elif isinstance(value, (datetime, date)):
        return value.isoformat()
    elif isinstance(value, Decimal):
        return float(value)
    elif hasattr(value, '__str__'):
        return str(value)
    return value

def sanitize_dict(data):
    if isinstance(data, dict):
        return {k: sanitize_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_dict(i) for i in data]
    else:
        return safe_serialize(data)

# ---------- Step 1: Cache old instance for update comparison ----------
@receiver(pre_save)
def cache_old_instance(sender, instance, **kwargs):
    if sender.__name__ == 'AuditLog':
        return
    if instance.pk:
        try:
            instance._old_instance = sender.objects.get(pk=instance.pk)
        except sender.DoesNotExist:
            instance._old_instance = None

# ---------- Step 2: Log create and update ----------
@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if sender.__name__ == 'AuditLog':
        return

    user = get_request_user()
    ip = get_request_ip()
    changes = {}

    old = getattr(instance, '_old_instance', None)
    is_create = created and not old
    is_update = not created and old

    if is_create:
        action = 'create'
        new_data = model_to_dict(instance)
        changes = sanitize_dict(new_data)

    elif is_update:
        action = 'update'
        old_data = model_to_dict(old)
        new_data = model_to_dict(instance)
        for field in new_data:
            old_val = old_data.get(field)
            new_val = new_data.get(field)
            if old_val != new_val:
                changes[field] = {
                    "from": safe_serialize(old_val),
                    "to": safe_serialize(new_val)
                }
        if not changes:
            changes = None
    else:
        return  # no changes or invalid state

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=sender.__name__,
        object_id=str(instance.pk),
        changes=changes,
        ip_address=ip
    )

# ---------- Step 3: Log delete ----------
@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if sender.__name__ == "AuditLog":
        return  # Prevent recursive logging

    user = getattr(instance, 'modified_by', None) or get_request_user()

    user_info = None
    if user:
        user_info = {
            "name": getattr(user, "name", None) or str(user),
            "email": getattr(user, "email", None)
        }

    instance_id = safe_serialize(getattr(instance, 'id', 'N/A'))
    instance_name = safe_serialize(getattr(instance, 'name', ''))

    summary_text = f"Deleted {sender.__name__} with name='{instance_name}', id='{instance_id}'"
    if user_info:
        summary_text += f" by user {user_info['name']} <{user_info['email']}>"

    AuditLog.objects.create(
        user=user,
        action='delete',
        model_name=sender.__name__,
        object_id=instance_id,
        changes={"summary": summary_text, "user": sanitize_dict(user_info)},
        ip_address=get_request_ip(),
    )
