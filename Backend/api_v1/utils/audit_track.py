

def get_model_diff(old_obj, new_obj, exclude_fields=None):
    changes = {}
    exclude_fields = exclude_fields or ["updated_at", "created_at", "id", "password"]

    for field in old_obj._meta.fields:
        field_name = field.name
        if field_name in exclude_fields:
            continue

        old_value = getattr(old_obj, field_name, None)
        new_value = getattr(new_obj, field_name, None)
        if old_value != new_value:
            changes[field_name] = {"from": old_value, "to": new_value}

    return changes
