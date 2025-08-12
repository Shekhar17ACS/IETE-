

from .thread import set_request_user, set_request_ip

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        ip = self.get_client_ip(request)

        if user and user.is_authenticated:
            set_request_user(user)
        set_request_ip(ip)

        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")

