

PROTECTED_ROLES = ["Super Admin", "Admin", "GD", "SG", "M", "FM", "A"]
ROLE_HIERARCHY = PROTECTED_ROLES[::-1]  # ["A", "FM", ..., "Super Admin"]

def get_next_required_role(approvals: dict):
    for role in ROLE_HIERARCHY:
        if not approvals.get(role):
            return role
    return None  # All approved

def is_user_allowed_to_approve(user, current_approvals):
    user_role = getattr(user, "role", None)
    if not user_role or user_role not in PROTECTED_ROLES:
        return False, "Invalid role"
    
    next_role = get_next_required_role(current_approvals)
    if user_role != next_role:
        return False, f"{user_role} cannot approve yet. Waiting for {next_role}"
    
    return True, None


from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff
