from django.contrib import admin
from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered

# Automatically register all models in the current app
app = apps.get_app_config('api_v1')

for model in app.get_models():
    try:
        admin.site.register(model)
    except AlreadyRegistered:
        pass
    
    