import threading

_thread_locals = threading.local()

def set_request_user(user):
    _thread_locals.user = user

def get_request_user():
    return getattr(_thread_locals, 'user', None)

def set_request_ip(ip):
    _thread_locals.ip = ip

def get_request_ip():
    return getattr(_thread_locals, 'ip', None)
