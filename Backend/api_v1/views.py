import io
import re
import json
import pdfkit
import logging
import random
import string
import pandas as pd
import razorpay, time
from io import BytesIO
from copy import deepcopy
from collections import defaultdict
from django.utils.html import escape
from django.http import FileResponse
from django.urls import reverse, path
from datetime import datetime, timedelta
from django.utils.html import strip_tags
from django.templatetags.static import static


from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404,render
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator

from .services import *

from rest_framework import status, permissions, serializers
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import LimitOffsetPagination, PageNumberPagination
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from xhtml2pdf import pisa
from django.contrib.contenttypes.models import ContentType

# Project-specific imports
from django.apps import apps
from .serializers import *
from .permissions import *
from .utils.eligibility import calculate_age, total_experience_years, has_valid_academic
from .utils.notification import *
from .utils.payment_verify import *
from .utils.export_data import *
from .utils.receipt_no import *
from .utils.proposer_email import send_proposer_invitation
from .helper import *


logger = logging.getLogger(__name__)
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

def send_email_otp(email, otp_code):
    subject = "Your OTP Code"
    message = f"Your OTP for verification is: {otp_code}. It is valid for 5 minutes."
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [email]

    send_mail(subject, message, from_email, recipient_list)
    

def check_permission_and_get_access(request, codename):
    user = getattr(request, "user", None)

    if not user or not user.is_authenticated:
        return (
            None,
            Response(
                {"detail": "Authentication is required to access this resource."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        )

    if not user.has_perm(codename):
        return (
            None,
            Response(
                {"detail": f"You do not have permission to perform this action: '{codename}'."},
                status=status.HTTP_403_FORBIDDEN
            )
        )

    return (user, None)



def check_permission_and_get_access(request, codename):
    user = getattr(request, "user", None)

    if not user or not user.is_authenticated:
        return (
            None,
            Response(
                {"detail": "Authentication is required to access this resource."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        )

    if not user.has_perm(codename):
        return (
            None,
            Response(
                {"detail": f"You do not have permission to perform this action: '{codename}'."},
                status=status.HTTP_403_FORBIDDEN
            )
        )

    return (user, None)




    
#Role Based Access
###################################  ROLE API  ###########################################################
class RoleListAPIView(GenericAPIView):
    serializer_class = RolelistSerializer
    permission_classes = [IsAuthenticated,IsAdminUser] #,IsAnyAuthenticatedUser,
    def get(self, request):
        user,error_response = check_permission_and_get_access(request,"api_v1.view_role")
        if error_response:
            return error_response
        
        # user_filters = {'user': user}
        list_model = Role.objects.all().order_by('-created_at')
        serializer = self.serializer_class(list_model, many=True)
        return  Response({"message": "Role List retrieved successfully","data":serializer.data}, status=status.HTTP_200_OK)

#Role Based Access Control API

def user_has_role(parent, role_name):
    return Role.objects.filter(name__iexact=role_name,parent__isnull=False).exists()


class RoleAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated,IsAdminUser] #IsAuthenticated,IsAdminUser,IsAnyAuthenticatedUser,
    serializer_class = RoleSerializer
    pagination_class = CustomPageNumberPagination

    def get(self, request,role_id=None,*args,**kwargs):
        user,error_response = check_permission_and_get_access(request, "api_v1.view_role")
        if error_response:
            return error_response
        
        if role_id:
            try:
                role = Role.objects.get(id=role_id)
            except Role.DoesNotExist:
                return Response({"message": "Role not found."}, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(role)
            return Response(serializer.data,status=status.HTTP_200_OK)

        get_model = Role.objects.all().order_by('-created_at')
        page = self.paginate_queryset(get_model)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.serializer_class(get_model, many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)

    def post(self, request):
        user, error_response = check_permission_and_get_access(request, "api_v1.add_role")
        if error_response:
            return error_response

        data = request.data
        # data['user'] = request.user.id

        # Check for duplicate role name
        if Role.objects.filter(name=data.get('name')).exists():
            return Response(
                {"message": f"A role with the name '{data.get('name')}' already exists in this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use transaction to ensure role and group are created atomically
        with transaction.atomic():
            serializer = self.serializer_class(data=data)
            if serializer.is_valid():
                role = serializer.save()

                # Use user_code as prefix for the group name
                group_name = f"{user.id}_{data.get('name')}"
                group, created = Group.objects.get_or_create(name=group_name)
                role.group = group  # Set the group's one-to-one relationship with role
                role.save()

                return Response({"message": "Role created successfully", "data": serializer.data}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, role_id=None,*args, **kwargs):
        user,error_response = check_permission_and_get_access(request, "api_v1.change_role")
        if error_response:
            return error_response

        new_name = request.data.get('name')
        if not new_name:
            return Response({"message": "Role name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            role = Role.objects.get(id=role_id)
        except Role.DoesNotExist:
            return Response({"message": "Role not found."}, status=status.HTTP_404_NOT_FOUND)
        # protected_roles = Role.objects.filter(parent__isnull=True).values_list('name', flat=True)
        # if role.name.lower() in protected_roles:
        #     return Response({"message": "This role cannot be updated."}, status=status.HTTP_403_FORBIDDEN)
        # if role.user != user:
        #     return Response({"message": "You can only update roles for your own user."}, status=status.HTTP_403_FORBIDDEN)

        if Role.objects.filter(name=new_name).exclude(id=role.id).exists():
            return Response(
                {"message": f"A role with the name '{new_name}' already exists for this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            role.name = new_name
            group_name = f"{role.id}_{new_name}"
            group, _ = Group.objects.get_or_create(name=group_name)
            role.group = group
            role.save()

            return Response({
                "message": "Role name updated successfully.",
                "data": {
                    "id": str(role.id),
                    "name": role.name,
                    "group": role.group.name,
                }
            }, status=status.HTTP_200_OK)
       
    def delete(self, request, role_id=None, *args, **kwargs):
        user,error_response = check_permission_and_get_access(request, "api_v1.delete_role")
        if error_response:
            return error_response
       
       
        if not role_id:
            return Response({"message": "Role ID is required in the URL."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            role = Role.objects.get(id=role_id)
        except Role.DoesNotExist:
            return Response({"message": "Role not found."}, status=status.HTTP_404_NOT_FOUND)
       
       
        # protected_roles = Role.objects.filter(parent__isnull=True).values_list('name', flat=True)
        # if role.name in protected_roles:
        #     return Response({"message": f"Role '{role.name}' cannot be deleted."}, status=status.HTTP_403_FORBIDDEN)

        # if role.user_id and role.user_id != user.id:
        #     return Response({"message": "You can only delete roles created by your account."}, status=status.HTTP_403_FORBIDDEN)

        deleted_role_data = {
            "id": str(role.id),
            "name": role.name,
            # "user_id": str(role.user.id) if role.user.id else None,
            "group_id": str(role.group_id) if role.group_id else None,
        }

        with transaction.atomic():
            if role.group_id and Group.objects.filter(id=role.group_id).exists():
                Group.objects.get(id=role.group_id).delete()
            role.delete()

        return Response({
            "message": "Role deleted successfully.",
            "deleted_role": deleted_role_data
        }, status=status.HTTP_200_OK)


#updated api
class PermissionMatrixView(APIView):
    permission_classes = [IsAuthenticated,IsAdminUser]

    def get_allowed_models(self, request):
        models_param = request.query_params.get("models")
        if models_param:
            return set(models_param.split(","))

        user_app_labels = {
            app.label for app in apps.get_app_configs()
            if not app.name.startswith("django.")
        }

        return set(
            Permission.objects.filter(content_type__app_label__in=user_app_labels)
            .values_list("content_type__model", flat=True)
            .distinct()
        )

    def get(self, request):
        user,error_response = check_permission_and_get_access(request, "api_v1.view_permission")
        if error_response:
            return error_response
        
        allowed_models = self.get_allowed_models(request)
        permissions = Permission.objects.select_related("content_type").filter(
            content_type__model__in=allowed_models
        )
        roles = Role.objects.all()
        permissions_data = []

        for perm in permissions:
            category = perm.content_type.model
            codename = perm.codename
            readable_name = f"Can {codename.replace('_', ' ')}"
            permission_id = f"{category}-{codename}"

            role_assignments = {}
            for role in roles:
                users = User.objects.filter(role=role)
                # Check if any user has the permission
                has_permission = any(user.user_permissions.filter(id=perm.id).exists() for user in users)
                role_assignments[role.name] = has_permission

            permissions_data.append({
                "id": permission_id,
                "name": readable_name,
                "category": category,
                "roles": role_assignments
            })

        return Response({"permissions": permissions_data}, status=200)

    def post(self, request):
        user,error_response = check_permission_and_get_access(request, "api_v1.add_permission")
        if error_response:
            return error_response
        role_name = request.data.get("role")
        permission_id = request.data.get("permission")
        value = request.data.get("value")

        if role_name is None or permission_id is None or value not in [True, False]:
            return Response({"error": "Missing or invalid fields."}, status=400)

        allowed_models = self.get_allowed_models(request)

        try:
            category, codename = permission_id.split("-", 1)
            if category not in allowed_models:
                return Response({"error": f"Model '{category}' not allowed."}, status=400)

            permission = Permission.objects.select_related("content_type").get(
                codename=codename,
                content_type__model=category
            )
            role = Role.objects.get(name=role_name)

            users = User.objects.filter(role=role)
            for user in users:
                if value:
                    user.user_permissions.add(permission)
                else:
                    user.user_permissions.remove(permission)

            return Response({"success": True}, status=200)

        except (Permission.DoesNotExist, Role.DoesNotExist):
            return Response({"error": "Permission or Role not found."}, status=404)

    def patch(self, request):
        user,error_response = check_permission_and_get_access(request, "api_v1.change_permission")
        if error_response:
            return error_response
        
        role_name = request.data.get("role")
        permissions_dict = request.data.get("permissions")

        if not role_name or not permissions_dict:
            return Response({"error": "Missing role or permissions."}, status=400)

        allowed_models = self.get_allowed_models(request)
        try:
            role = Role.objects.get(name=role_name)
            users = User.objects.filter(role=role)

            for permission_id, value in permissions_dict.items():
                if "-" not in permission_id or value not in [True, False]:
                    continue

                category, codename = permission_id.split("-", 1)
                if category not in allowed_models:
                    continue

                try:
                    permission = Permission.objects.select_related("content_type").get(
                        codename=codename,
                        content_type__model=category
                    )
                    for user in users:
                        if value:
                            user.user_permissions.add(permission)
                        else:
                            user.user_permissions.remove(permission)
                except Permission.DoesNotExist:
                    continue

            return Response({"success": True}, status=200)

        except Role.DoesNotExist:
            return Response({"error": "Role not found."}, status=404)


class SignupAPIView(APIView):
    def post(self, request):
        session = request.session
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)

            if user.is_active:
                return Response({"error": "User already registered with this email."}, status=status.HTTP_400_BAD_REQUEST)

            # User exists but is inactive → resend OTP
            otp_code = str(random.randint(100000, 999999))
            now = timezone.now()
            session.update({
                "email": user.email,
                "otp": otp_code,
                "otp_expires_at": (now + timedelta(minutes=5)).isoformat(),
                "otp_requests": [now.isoformat()]
            })
            session.modified = True

            send_email_otp(user.email, otp_code)

            return Response({"message": "User already exists but not verified. OTP has been resent."}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            # Brand new signup
            serializer = SignupSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            user = serializer.save()
            user.is_active = False
            user.save(update_fields=["is_active"])

            otp_code = str(random.randint(100000, 999999))
            now = timezone.now()
            session.update({
                "email": user.email,
                "otp": otp_code,
                "otp_expires_at": (now + timedelta(minutes=5)).isoformat(),
                "otp_requests": [now.isoformat()]
            })
            session.modified = True

            send_email_otp(user.email, otp_code)

            return Response({"message": "Signup successful. OTP sent to your email."}, status=status.HTTP_201_CREATED)


class VerifyOTPAPIView(APIView):
    def post(self, request):
        session = request.session
        otp_input = request.data.get("otp")
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_input:
            return Response({"error": "Otp is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        stored_otp = session.get("otp")
        otp_expiry_str = session.get("otp_expires_at")

        if not stored_otp or stored_otp != otp_input:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_expiry_str:
            return Response({"error": "OTP expiration time not found. Please request a new OTP."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Convert string back to datetime
        otp_expiry = timezone.datetime.fromisoformat(otp_expiry_str)

        if timezone.now() > otp_expiry:
            return Response({"error": "OTP has expired. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Activate user and generate application ID
        user.is_active = True
        if not user.application_id:
            user.application_id = user.generate_application_id()
        user.save(update_fields=["is_active", "application_id"])

        # Clear session data
        for key in ["otp", "otp_expires_at", "email"]:
            session.pop(key, None)
        session.modified = True

        # Send email to the user
        subject = "Your Application ID"
        message = f"Dear {user.name},\n\nYour application ID is: {user.application_id}.\n\nThank you for registering!"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]

        send_mail(subject, message, from_email, recipient_list)

        return Response({
            "message": "OTP verified. Signup complete. Application ID has been sent to your email.",
            "application_id": user.application_id
        }, status=status.HTTP_200_OK)

class ResendOTPAPIView(APIView):
    def post(self, request):
        session = request.session
        email = session.get("email") or request.data.get("email")

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        otp_requests = session.get("otp_requests", [])
        now = timezone.now()

        # Filter only recent (valid) OTP requests
        valid_otp_requests = [
            t for t in otp_requests
            if now - timezone.datetime.fromisoformat(t) < timedelta(minutes=10)
        ]

        if len(valid_otp_requests) >= 3:
            return Response({"error": "Too many OTP requests. Try again later."},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Generate OTP
        otp_code = str(random.randint(100000, 999999))

        # Update session
        session["email"] = email
        session["otp"] = otp_code
        session["otp_expires_at"] = (now + timedelta(minutes=5)).isoformat()
        valid_otp_requests.append(now.isoformat())
        session["otp_requests"] = valid_otp_requests
        session.modified = True

        send_email_otp(email, otp_code)

        return Response({"message": "New OTP sent to your email."}, status=status.HTTP_200_OK)

from django.db.models import Sum, Count
from django.utils.timezone import now
class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user,error_response = check_permission_and_get_access(request, "api_v1.view_user")
        if error_response:
            return error_response
        # Basic Stats
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_revenue = Payment.objects.filter(status="Success").aggregate(total=Sum("amount"))["total"] or 0

        today = now().date()
        first_of_this_month = today.replace(day=1)
        last_month_day = first_of_this_month - timedelta(days=1)
        first_of_last_month = last_month_day.replace(day=1)

        # Growth Rate
        last_month_users = User.objects.filter(
            created_at__gte=first_of_last_month,
            created_at__lt=first_of_this_month
        ).count()

        growth_rate = 0
        if last_month_users > 0:
            growth_rate = round(((total_users - last_month_users) / last_month_users) * 100, 2)

        # New Users This Month
        new_users_this_month = User.objects.filter(created_at__gte=first_of_this_month).count()

        # Revenue Split by Membership Type & Status
        revenue_breakdown = (
            Payment.objects
            .values("membership_type", "status")
            .annotate(total_amount=Sum("amount"), count=Count("id"))
            .order_by("membership_type", "status")
        )

        # Recent Signups (latest 5 users)
        recent_users = list(
            User.objects.order_by("-created_at")
            .values("id", "name", "email", "created_at")[:5]
        )

        return Response({
            "total_users": total_users,
            "active_users": active_users,
            "total_revenue": total_revenue,
            "growth_rate": growth_rate,
            "new_users_this_month": new_users_this_month,
            "revenue_breakdown": revenue_breakdown,
            "recent_signups": recent_users,
        })    
    

# class LoginAPIView(APIView):
#     """ API to authenticate users using multiple login methods """

#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         mobile_number = request.data.get("mobile_number")
#         application_id = request.data.get("application_id")
#         password = request.data.get("password")
#         otp = request.data.get("otp")

#         session = request.session

#         # Case 1: Login with Email & Password
#         if email and password:
#             try:
#                 user = User.objects.get(email=email)
#             except User.DoesNotExist:
#                 return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

#             if not user.is_active:
#                 return Response({"error": "User account is inactive. Verify OTP first."}, status=status.HTTP_403_FORBIDDEN)

#             if not user.check_password(password):
#                 return Response({"error": "Invalid password."}, status=status.HTTP_400_BAD_REQUEST)

#             return self.generate_login_response(user)

#         # Case 2: Login with Mobile Number & Password
#         elif mobile_number and password:
#             try:
#                 user = User.objects.get(mobile_number=mobile_number)
#             except User.DoesNotExist:
#                 return Response({"error": "User with this mobile number does not exist."}, status=status.HTTP_400_BAD_REQUEST)

#             if not user.is_active:
#                 return Response({"error": "User account is inactive. Verify OTP first."}, status=status.HTTP_403_FORBIDDEN)

#             if not user.check_password(password):
#                 return Response({"error": "Invalid password."}, status=status.HTTP_400_BAD_REQUEST)

#             return self.generate_login_response(user)

#         # Case 3: Login with Application ID & Password
#         elif application_id and password:
#             try:
#                 user = User.objects.get(application_id=application_id)
#             except User.DoesNotExist:
#                 return Response({"error": "User with this application ID does not exist."}, status=status.HTTP_400_BAD_REQUEST)

#             if not user.is_active:
#                 return Response({"error": "User account is inactive. Verify OTP first."}, status=status.HTTP_403_FORBIDDEN)

#             if not user.check_password(password):
#                 return Response({"error": "Invalid password."}, status=status.HTTP_400_BAD_REQUEST)

#             return self.generate_login_response(user)

#         # Case 4: Login with Email & OTP
#         elif email and otp:
#             try:
#                 user = User.objects.get(email=email)
#             except User.DoesNotExist:
#                 return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

#             return self.verify_otp_login(session, user, otp)

#         # Case 5: Login with Application ID & OTP
#         elif application_id and otp:
#             try:
#                 user = User.objects.get(application_id=application_id)
#             except User.DoesNotExist:
#                 return Response({"error": "User with this application ID does not exist."}, status=status.HTTP_400_BAD_REQUEST)

#             return self.verify_otp_login(session, user, otp)

#         else:
#             return Response({"error": "Invalid login credentials."}, status=status.HTTP_400_BAD_REQUEST)

#     def generate_login_response(self, user):
#         """ Generate response upon successful login """
#         refresh = RefreshToken.for_user(user)
#         access_token = str(refresh.access_token)
#         return Response({
#             "message": "Login successful.",
#             "user": {

#                 "id": user.id,
#                 "email": user.email,
#                 "mobile_number": user.mobile_number,
#                 "application_id": user.application_id,
#                 "name": user.name
#             },
#             "token": access_token,
#             "refresh_token": str(refresh)
#         }, status=status.HTTP_200_OK)

#     def verify_otp_login(self, session, user, otp_input):
#         """ Verify OTP for login """
#         stored_otp = session.get("otp")
#         otp_expiry_str = session.get("otp_expires_at")

#         if not stored_otp or stored_otp != otp_input:
#             return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

#         if not otp_expiry_str:
#             return Response({"error": "OTP expiration time not found. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

#         otp_expiry = timezone.datetime.fromisoformat(otp_expiry_str)

#         if timezone.now() > otp_expiry:
#             return Response({"error": "OTP has expired. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

#         # Clear OTP session after successful verification
#         for key in ["otp", "otp_expires_at", "email"]:
#             session.pop(key, None)
#         session.modified = True

#         return self.generate_login_response(user)



class RoleLoginAPIView(APIView):
    """ API to authenticate users using multiple login methods """

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        mobile_number = request.data.get("mobile_number")
        application_id = request.data.get("application_id")
        membership_id = request.data.get("membership_id")
        password = request.data.get("password")
        otp = request.data.get("otp")

        session = request.session

        # Case 1: Login with Email & Password
        if email and password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

            if not user.is_active:
                return Response({"error": "User account is inactive. Verify OTP first."}, status=status.HTTP_403_FORBIDDEN)

            if not user.check_password(password):
                return Response({"error": "Invalid password."}, status=status.HTTP_400_BAD_REQUEST)

            return self.generate_login_response(user)

        # Case 2: Login with Mobile Number & Password
        elif mobile_number and password:
            try:
                user = User.objects.get(mobile_number=mobile_number)
            except User.DoesNotExist:
                return Response({"error": "User with this mobile number does not exist."}, status=status.HTTP_400_BAD_REQUEST)

            if not user.is_active:
                return Response({"error": "User account is inactive. Verify OTP first."}, status=status.HTTP_403_FORBIDDEN)

            if not user.check_password(password):
                return Response({"error": "Invalid password."}, status=status.HTTP_400_BAD_REQUEST)

            return self.generate_login_response(user)

        # Case 3: Login with Application ID & Password
        elif application_id and password:
            try:
                user = User.objects.get(application_id=application_id)
            except User.DoesNotExist:
                return Response({"error": "User with this application ID does not exist."}, status=status.HTTP_400_BAD_REQUEST)

            if not user.is_active:
                return Response({"error": "User account is inactive. Verify OTP first."}, status=status.HTTP_403_FORBIDDEN)

            if not user.check_password(password):
                return Response({"error": "Invalid password."}, status=status.HTTP_400_BAD_REQUEST)

            return self.generate_login_response(user)

        # Case 4: Login with Membership ID & Password
        elif membership_id and password:
            try:
                user = User.objects.get(membership_id=membership_id)
            except User.DoesNotExist:
                return Response({"error": "User with this membership ID does not exist."}, status=status.HTTP_400_BAD_REQUEST)
            if not user.is_active:
                return Response({"error": "User account is inactive. Verify OTP first."}, status=status.HTTP_403_FORBIDDEN)
            if not user.check_password(password):
                return Response({"error": "Invalid password."}, status=status.HTTP_400_BAD_REQUEST)
            return self.generate_login_response(user)

        # Case 4: Login with Email & OTP
        elif email and otp:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

            return self.verify_otp_login(session, user, otp)

        # Case 5: Login with Application ID & OTP
        elif application_id and otp:
            try:
                user = User.objects.get(application_id=application_id)
            except User.DoesNotExist:
                return Response({"error": "User with this application ID does not exist."}, status=status.HTTP_400_BAD_REQUEST)

            return self.verify_otp_login(session, user, otp)

        else:
            return Response({"error": "Invalid login credentials."}, status=status.HTTP_400_BAD_REQUEST)

    def generate_login_response(self, user):
        """ Generate response upon successful login """
        refresh = RefreshToken.for_user(user)

        # Add custom claims to the token
        refresh['user_id'] = str(user.id)
        refresh['username'] = user.username
        refresh['email'] = user.email
        refresh['role'] = user.role.name if user.role else None
        # 🔥 Add all permission codenames like: "app_label.view_model"
        permissions = list(user.get_all_permissions())

        return Response({
            "message": "Login successful.",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.name if user.role else None,
                "mobile_number": user.mobile_number,
                "application_id": user.application_id,
                "membership_id": user.membership_id,
                "name": user.name,
                "permissions": permissions  # ✅ Add this
            },
            "token": str(refresh.access_token),
            "refresh_token": str(refresh),            
        }, status=status.HTTP_200_OK)
        
    def verify_otp_login(self, session, user, otp_input):
        """ Verify OTP for login """
        stored_otp = session.get("otp")
        otp_expiry_str = session.get("otp_expires_at")

        if not stored_otp or stored_otp != otp_input:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_expiry_str:
            return Response({"error": "OTP expiration time not found. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_expiry = timezone.datetime.fromisoformat(otp_expiry_str)

        if timezone.now() > otp_expiry:
            return Response({"error": "OTP has expired. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Clear OTP session after successful verification
        for key in ["otp", "otp_expires_at", "email"]:
            session.pop(key, None)
        session.modified = True

        return self.generate_login_response(user)


class RequestPasswordResetAPIView(APIView):
    """ API to request password reset for logged-in user """

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a password reset token and encode user ID
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"{settings.FRONTEND_URL}/reset-password/?uid={uid}&token={token}"

        # Send email with reset link
        send_mail(
            subject="Password Reset Request",
            message=f"Click the link to reset your password: {reset_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )

        return Response({"message": "Password reset link sent to your email."}, status=status.HTTP_200_OK)


class ResetPasswordAPIView(APIView):
    """ API to reset password using token from query params """

    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.query_params.get("uid")
        token = request.query_params.get("token")

        if not uidb64 or not token:
            return Response({"error": "Missing reset token or user ID."}, status=status.HTTP_400_BAD_REQUEST)

        # Decode user ID from base64
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Invalid user ID."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate the token
        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate new password
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Update user's password
        user.password = make_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)


class AddMember(APIView):
    permission_classes=[IsAuthenticated,IsAdminUser]
    def get_role_prefix(self, role):
        try:
            if not role or not hasattr(role, 'name'):
                return None
            words = role.name.strip().split()
            prefix = ''.join(word[0] for word in words[:2]).upper()
            return prefix if prefix else None
        except Exception:
            return None

    def normalize_record(self, item):
        normalized = {}
        for key, value in item.items():
            if isinstance(value, bool):
                normalized[key] = str(value).lower()
            elif isinstance(value, datetime):
                normalized[key] = value.date()
            elif isinstance(value, date):
                normalized[key] = value
            elif pd.isna(value) or value in [None, "nan", "NaN"]:
                normalized[key] = None
            else:
                normalized[key] = str(value).strip() if isinstance(value, str) else value
        return normalized

    def handle_json_data(self, data):
        if isinstance(data, list):
            clean_records = [self.normalize_record(item) for item in data]
            return clean_records, True
        else:
            record = self.normalize_record(data)
            return record, False

    def handle_file_data(self, file):
        if file.name.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            raise ValueError("Unsupported file format. Only .csv or .xlsx allowed.")
        df = df.fillna("")
        records = df.to_dict(orient='records')
        normalized_records = [self.normalize_record(record) for record in records]
        return normalized_records, True

    def get(self, request, member_id=None):
        user,error_response = check_permission_and_get_access(request, "api_v1.view_user")
        if error_response:
            return error_response
        
        if member_id:
            user = get_object_or_404(User, id=member_id)
            serializer = EmployeeSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # users = User.objects.all()
            users = User.objects.exclude(membership_id__isnull=True)
            serializer = EmployeeSerializer(users, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)    

    def post(self, request):
        user,error_response = check_permission_and_get_access(request, "api_v1.add_user")
        if error_response:
            return error_response
        try:
            if 'file' in request.FILES:
                records, is_bulk = self.handle_file_data(request.FILES['file'])
            elif isinstance(request.data, (list, dict)):
                records, is_bulk = self.handle_json_data(request.data)
            else:
                return Response({'error': 'Unsupported data format. Please send JSON or file upload.'}, status=400)

            if is_bulk:
                serializer = EmployeeSerializer(data=records, many=True)
                if serializer.is_valid():
                    last_numbers = {}
                    instances = []

                    for raw_item in serializer.validated_data:
                        item = deepcopy(raw_item)

                        if 'membership_id' in item and item['membership_id']:
                            continue

                        role = item['role']
                        role_name = role.name
                        prefix = self.get_role_prefix(role)

                        if not prefix:
                            raise ValueError(f"No prefix configured for role: {role_name}")

                        if prefix not in last_numbers:
                            last_user = User.objects.filter(membership_id__startswith=f"{prefix}-") .order_by('-membership_id').first()
                            if last_user:
                                try:
                                    number_part = last_user.membership_id.split('-')[1]
                                    last_numbers[prefix] = int(number_part)
                                except (IndexError, ValueError):
                                    last_numbers[prefix] = 0
                            else:
                                last_numbers[prefix] = 0

                        while True:
                            last_numbers[prefix] += 1
                            potential_id = f"{prefix}-{last_numbers[prefix]:06d}"
                            if not User.objects.filter(membership_id=potential_id).exists():
                                item['membership_id'] = potential_id
                                break

                        instances.append(User(**item))
                    User.objects.bulk_create(instances)
                    return Response(EmployeeSerializer(instances, many=True).data, status=201)

                return Response(serializer.errors, status=400)

            serializer = EmployeeSerializer(data=records)
            if serializer.is_valid():
                instance = serializer.save()
                return Response(EmployeeSerializer(instance).data, status=201)

            return Response(serializer.errors, status=400)

        except ValueError as ve:
            return Response({'error': str(ve)}, status=400)
        except Exception as e:
            return Response({'error': f"Unexpected error: {str(e)}"}, status=500)

    def put(self, request, member_id):
            user,error_response = check_permission_and_get_access(request, "api_v1.change_user")
            if error_response:
                return error_response
            user = get_object_or_404(User, id=member_id)
            serializer = EmployeeSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, member_id):
            user,error_response = check_permission_and_get_access(request, "api_v1.delete_user")
            if error_response:
                return error_response
            user = get_object_or_404(User, id=member_id)
            user.delete()
            return Response({"message": "Employee deleted successfully"}, status=status.HTTP_204_NO_CONTENT)         


class UpdatePersonalDetailsAPIView(GenericAPIView):
    serializer_class = UpdatePersonalDetailsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    # ——— GET: retrieve current user details ———
    def get(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user)
        return Response(
            {
                "status": status.HTTP_200_OK,
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    # ——— PATCH: partial update (incl. title/custom_title) ———
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        data = request.data.copy()

        # Interpret `from_india`
        req_from_india = data.get("from_india")
        if req_from_india is None:
            is_from_india = user.from_india
        else:
            is_from_india = str(req_from_india).lower() == "true"

        # Required fields per country status
        if is_from_india:
            required = [
                "title", "name", "last_name", "father_name", "mother_name",
                "date_of_birth", "gender", "country", "state", "city",
                "pincode", "address1", "address2",
            ]
        else:
            required = [
                "title", "name", "last_name", "father_name", "mother_name",
                "date_of_birth", "gender", "country", "address1", "address2",
            ]

        # Validate
        missing = []
        for f in required:
            if f == "title":
                # title is satisfied if user already has one, or if they sent title PK or custom_title
                if not (user.title or data.get("title") or not data.get("title")):
                    missing.append("title")
                continue

            val = data.get(f) or getattr(user, f, None)
            if f in request.FILES:
                val = request.FILES[f]
            if not val:
                missing.append(f)

        if missing:
            return Response(
                {
                    "status": status.HTTP_400_BAD_REQUEST,
                    "error": "Missing required fields.",
                    "missing_fields": missing
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delegate to serializer (handles title/custom_title in update())
        serializer = self.get_serializer(user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "status": status.HTTP_200_OK,
                "message": "Personal details updated successfully.",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        

class AddCentre(APIView):
    def get(self,request):
        center=Centre.objects.all()
        serializer=CentreSerializer(center,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    def post(self, request):
        data = request.data
        is_many = isinstance(data, list)
        
        serializer = CentreSerializer(data=data, many=is_many)
        if serializer.is_valid():
            centres = serializer.save()
            return Response(CentreSerializer(centres, many=is_many).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AddSubCentre(APIView):
    
    def get(self,request):
        center=SubCentre.objects.all()
        serializer=SubCentreSerializer(center,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    def post(self, request):
        data = request.data
        is_many = isinstance(data, list)
        
        serializer = SubCentreSerializer(data=data, many=is_many)
        if serializer.is_valid():
            centres = serializer.save()
            return Response(SubCentreSerializer(centres, many=is_many).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
###########################################################################################################

class VerifyPaymentAPIView(APIView):
    def post(self, request):
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        try:
            razorpay_client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })

            payment = Payment.objects.get(order_id=razorpay_order_id)
            payment.status = "Success"
            payment.payment_id = razorpay_payment_id
            payment.save()

            return Response({"message": "Payment successful!"})
        except:
            return Response({"message": "Payment verification failed!"}, status=400)



############################### SHALENDER  ###########################################

class SaveMembershipFeeAPIView(APIView):
    def post(self,request):
        membership_fee = request.query_params.get('membership_fee')
        if membership_fee:
            try:
                membership_fee = MembershipFee.objects.get(id=membership_fee)
            except ValueError:
                return Response({"error": "Invalid membership fee"}, status=status.HTTP_400_BAD_REQUEST)

            # Save the membership fee to the user's profile or wherever needed
            request.user.membership_fee = membership_fee
            request.user.save()

            return Response({"message": "Membership fee saved successfully"}, status=status.HTTP_200_OK)

        return Response({"error": "Membership fee is required"}, status=status.HTTP_400_BAD_REQUEST)

    
class ExperienceAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)

    def get(self, request):
        eid = request.query_params.get('id')
        qs = self.get_queryset()

        if eid:
            try:
                experience = qs.get(id=eid)
                serializer = ExperienceSerializer(experience)
                return Response({
                    "status": "success",
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            except Experience.DoesNotExist:
                raise NotFound("Experience not found")

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = ExperienceSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        experiences = []
        errors = []

        # Process up to 9 experiences
        for index in range(1, 10):
            data = {
                'organization_name': request.data.get(f'organization_name_{index}'),
                'employee_type': request.data.get(f'employee_type_{index}'),
                'job_title': request.data.get(f'job_title_{index}'),
                'currently_working': request.data.get(f'currently_working_{index}', False),
                'start_date': request.data.get(f'start_date_{index}'),
                'end_date': request.data.get(f'end_date_{index}'),
                'work_type': request.data.get(f'work_type_{index}'),
                'total_experience': request.data.get(f'total_experience_{index}')
            }

            # Skip if organization_name is missing (indicates no experience provided)
            if not data['organization_name']:
                continue

            # Validate required fields
            if not data['start_date']:
                errors.append({
                    "index": index,
                    "errors": {"start_date": "This field is required."}
                })
                continue

            # Validate currently_working and end_date
            currently_working = data['currently_working']
            if isinstance(currently_working, str):
                currently_working = currently_working.lower() == 'true'
            if currently_working:
                data.pop('end_date', None)
            else:
                if not data.get('end_date'):
                    errors.append({
                        "index": index,
                        "errors": {"end_date": "This field is required if currently_working is False."}
                    })
                    continue

            experiences.append(data)

        # If there are errors from initial checks, return them
        if errors:
            return Response({"status": "error", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Save experiences atomically
        created_objs = []
        with transaction.atomic():
            for index, data in enumerate(experiences, 1):
                serializer = ExperienceSerializer(data=data)
                if serializer.is_valid():
                    serializer.save(user=request.user)
                    created_objs.append(serializer.data)
                else:
                    errors.append({"index": index, "errors": serializer.errors})

            if errors:
                return Response({"status": "error", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        logger.debug(f"Created experiences: {created_objs}")
        return Response({
            "status": "success",
            "message": "Experiences uploaded successfully",
            "data": created_objs
        }, status=status.HTTP_201_CREATED)

    def put(self, request):
        payloads = request.data if isinstance(request.data, list) else [request.data]
        out = []
        errors = []

        with transaction.atomic():
            for index, data in enumerate(payloads, 1):
                eid = data.get('id')
                if not eid:
                    errors.append({
                        "index": index,
                        "errors": {"id": "This field is required for update"}
                    })
                    continue

                try:
                    experience = self.get_queryset().get(id=eid)
                except Experience.DoesNotExist:
                    errors.append({
                        "index": index,
                        "errors": {"id": f"Experience with ID {eid} not found"}
                    })
                    continue

                # Validate required fields
                start_date = data.get('start_date', experience.start_date)
                if not start_date:
                    errors.append({
                        "index": index,
                        "errors": {"start_date": "This field is required."}
                    })
                    continue

                # Validate currently_working and end_date
                currently_working = data.get('currently_working', experience.currently_working)
                if isinstance(currently_working, str):
                    currently_working = currently_working.lower() == 'true'
                if currently_working:
                    data.pop('end_date', None)
                else:
                    end_date = data.get('end_date', experience.end_date)
                    if not end_date:
                        errors.append({
                            "index": index,
                            "errors": {"end_date": "This field is required if currently_working is False."}
                        })
                        continue

                serializer = ExperienceSerializer(experience, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    out.append(serializer.data)
                else:
                    errors.append({"index": index, "errors": serializer.errors})

            if errors:
                return Response({"status": "error", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "status": "success",
            "message": "Experiences updated successfully",
            "data": out
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        eid = request.query_params.get('id')
        if not eid:
            return Response({
                "status": "error",
                "message": "Experience ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            experience = self.get_queryset().get(id=eid)
        except Experience.DoesNotExist:
            raise NotFound("Experience not found")

        experience.delete()
        return Response({
            "status": "success",
            "message": "Experience deleted successfully",
        }, status=status.HTTP_204_NO_CONTENT)

# ============ Updated Api for sending email to proposer=====================

class ProposersAPIView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class  = CustomPageNumberPagination
    
    def get(self, request):
        pid = request.query_params.get("id")
        qs = Proposer.objects.filter(user=request.user)
        if pid:
            qs = qs.filter(id=pid)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = ProposersSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        user = request.user
        data = request.data

        # Update user fields
        for field in ("exposure", "electronics_experience", "area_of_specialization"):
            if field in data:
                setattr(user, field, data[field])
        user.save()

        proposers = data.get("proposers")
        if not isinstance(proposers, list):
            return Response({"detail": "Field 'proposers' must be a list."}, status=400)

        existing = Proposer.objects.filter(user=user).count()
        if existing + len(proposers) > 2:
            return Response({"detail": "Only 2 proposers allowed."}, status=400)

        results = []
        for item in proposers:
            email = item.get("email")
            membership_no = item.get("membership_no")

            if not email:
                return Response({"detail": " Email are required for each proposer."}, status=400)

            if not membership_no:
                return Response({"detail": "Membership_no are required for each proposer."}, status=400)

            # Check if proposer exists with both email and membership_no
            proposer_user_qs = User.objects.filter(email=email, membership_id=membership_no)
            if not proposer_user_qs.exists():
                return Response({
                    "detail": f"No user found with email '{email}' and membership number '{membership_no}'."
                }, status=404)

            serializer = ProposersSerializer(data=item)
            serializer.is_valid(raise_exception=True)
            proposer = serializer.save(user=user)
            send_proposer_invitation(proposer, applicant_name=user.name)
            results.append(ProposersSerializer(proposer).data)

        return Response({"data": results}, status=201)


class ProposerActionAPIView(APIView):
    def get(self, request):
        token = request.query_params.get("token")
        action = request.query_params.get("action")

        if not token or action not in ['approve', 'reject']:
            return Response({"detail": "Invalid token or action."}, status=400)

        try:
            proposer = Proposer.objects.get(token=token)
        except Proposer.DoesNotExist:
            return Response({"detail": "Token not found."}, status=404)

        if timezone.now() > proposer.expiry_date:
            proposer.status = 'expired'
            proposer.save()
            return Response({"detail": "This request has expired."}, status=400)

        if proposer.status != 'pending':
            return Response({"detail": "Action already taken."}, status=400)

        proposer.status = 'approved' if action == 'approve' else 'rejected'
        proposer.save()

        # Notify applicant
        subject = "Membership Proposer Response"
        msg = f"Your proposer {proposer.name} has {proposer.status} your membership request."
        send_mail(subject, msg, settings.DEFAULT_FROM_EMAIL, [proposer.user.email])

        # return Response({"detail": f"Proposer {proposer.status} successfully."}, status=200)
        return Response({
            "status": proposer.status,
            "proposer": proposer.name,
            "applicant": proposer.user.name,
            "message": f"{proposer.name} has {proposer.status} the membership request of {proposer.user.name}."
        }, status=200)



class GetAllUsers(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # users = User.objects.all()
        users=User.objects.select_related('role').all()
        # serializer=ConfigSerializer(users,many=True)
        # return Response(serializer.data, status=status.HTTP_200_OK)
        
        data = []
        for user in users:
            data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role.name if user.role else None,
                # add other fields as needed
            })

        return Response(data, status=status.HTTP_200_OK)
 
    


class QualificationAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    pagination_class   = CustomPageNumberPagination

    def get(self, request):
        qid = request.query_params.get('id')
        qs  = Qualification.objects.filter(user=request.user)
        if qid:
            qs = qs.filter(id=qid)

        # ← instantiate only once
        paginator = self.pagination_class()
        page      = paginator.paginate_queryset(qs, request)

        # if you always want pagination:
        serializer = QualificationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)



    def post(self, request,):
        qualifications = []
        index = 0

        while index < 9:
            if not request.data.get(f'[{index}]institute_name'):
                index += 1
                continue
            qualifications.append({
                'qualification_type': request.data.get(f'[{index}]qualification_type'),
                'qualification_branch': request.data.get(f'[{index}]qualification_branch'),
                'institute_name': request.data.get(f'[{index}]institute_name'),
                'board_university': request.data.get(f'[{index}]board_university'),
                'year_of_passing': request.data.get(f'[{index}]year_of_passing'),
                'percentage_cgpa': request.data.get(f'[{index}]percentage_cgpa'),
                'document': request.FILES.get(f'[{index}]document'),
            })
            index += 1

        errors = []
        created_objs = []
        print(qualifications)
        for data in qualifications:
            serializer = QualificationSerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                created_objs.append(serializer.data)
            else:
                errors.append(serializer.errors)

        if errors:
            return Response({'errors': errors}, status=400)

        return Response({'success': True, 'message': 'Qualifications uploaded successfully.', 'data': created_objs}, status=201)
    
    def put(self, request):
        payloads = request.data if isinstance(request.data, list) else [request.data]
        out = []
        user_qs = Qualification.objects.filter(user=request.user)

        for data in payloads:
            qid = data.get('id')
            if qid and user_qs.filter(id=qid).exists():
                inst = user_qs.get(id=qid)
                ser = QualificationSerializer(inst, data=data, partial=True)
            else:
                ser = QualificationSerializer(data=data)
            ser.is_valid(raise_exception=True)
            ser.save(user=request.user)
            out.append(ser.data)

        return Response({'data': out})

    def delete(self, request):
        qid = request.data.get('id')
        try:
            obj = Qualification.objects.get(id=qid, user=request.user)
        except Qualification.DoesNotExist:
            raise NotFound("Qualification not found")
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class QualificationTypeAPI(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        qualifications=QualificationType.objects.all()
        serializer=QualificationTypeSerialiser(qualifications,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
class QualificationBranchAPI(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        qualifications=QualificationBranch.objects.all()
        serializer=QualificationBranchSerialiser(qualifications,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)

########################  ELIGIBILITY #######################################################

class EligibilityAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1) Compute age
        if not user.date_of_birth:
            return Response({"detail": "Date of birth required"}, status=400)
        age = calculate_age(user.date_of_birth)

        # 2) Compute total years of experience
        exp_years = total_experience_years(user.experiences.all())

        # 3) Check academic qualification
        if not has_valid_academic(user.qualifications.all()):
            # if they’ve no valid academic, they’re only eligible for none
            return Response([])

        # 4) Filter all MembershipFee by age‐range and then by the extra rules
        eligible = []
        for fee in MembershipFee.objects.all():
            # age check
            if not fee.is_foreign_member:
                low = fee.min_age or 0
                high = fee.max_age or 999
                if age < low or age > high:
                    continue

            # experience rules vary by membership_type
            mtype = fee.membership_type.lower()
            if "fellow" in mtype and exp_years < 10:
                continue
            if "member" in mtype and "associate" not in mtype and exp_years < 5:
                continue
            # Associate Members have no experience requirement beyond academic

            # if all checks pass, include it
            eligible.append({
                "membership_type": fee.membership_type,
                "fee_amount": str(fee.fee_amount),
                "currency": fee.currency,
                "gst_percentage": str(fee.gst_percentage),
            })

        return Response(eligible)

#######################  ELIGIBILITY #######################################################

class EligibilityAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return MembershipFee.objects.filter(currency="INR" if user.from_india else "USD")

    def get(self, request):
        user = request.user

        # 1) Age check
        if not user.date_of_birth:
            return Response({"detail": "Date of birth required"}, status=400)
        age = calculate_age(user.date_of_birth)

        # 2) Experience
        exp_years = total_experience_years(user.experiences.all())

        # 3) Academic qualification check
        if not has_valid_academic(user.qualifications.all()):
            return Response({"is_eligible": False, "eligible_plans": []})

        # 4) Determine eligible plans
        eligible = []
        user_fee = getattr(user, "membership_fee", None)
        is_eligible = False

        for fee in self.get_queryset():
            if not (fee.min_age or 0) <= age <= (fee.max_age or 999):
                continue

            if fee.experience > exp_years:
                continue

            eligible.append({
                "membership_type": fee.membership_type,
                "fee_amount": str(fee.fee_amount if user.from_india else 440),  # Replace 440 with actual USD value logic
                "currency": fee.currency if user.from_india else "USD",
                "gst_percentage": str(fee.gst_percentage),
            })

            if user_fee and fee.pk == user_fee.pk:
                is_eligible = True

        return Response({
            "is_eligible": is_eligible,
            "eligible_plans": eligible
        })

class MembershipFeeListCreateAPIView(GenericAPIView):
    serializer_class = MembershipFeeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.from_india:
            return MembershipFee.objects.filter(currency="INR")
        else:
            return MembershipFee.objects.filter(currency="USD")

    def get(self, request, *args, **kwargs):
        user = request.user


        # 1) Compute age
        if not user.date_of_birth:
            return Response({"detail": "Date of birth required"}, status=400)
        age = calculate_age(user.date_of_birth)

        # 2) Compute total years of experience
        exp_years = total_experience_years(user.experiences.all())

        # 3) Check academic qualification
        if not has_valid_academic(user.qualifications.all()):
            return Response([])

        # 4) Filter membership fees by eligibility
        membership_fees = self.get_queryset()
        serializer = self.get_serializer(membership_fees, many=True)
        
        # Customize response based on user's eligibility and from_india status
        response_data = []
        for fee_data in serializer.data:
            # Age check
            low = fee_data["min_age"] or 0
            high = fee_data["max_age"] or 999
            if age < low or age > high:
                continue

            # Experience check
            mtype = fee_data["membership_type"].lower()
            if fee_data["experience"] and fee_data["experience"] > float(exp_years):
                continue
            # Note: Associate Members have no experience requirement beyond academic, handled by has_valid_academic

            # If all checks pass, include the fee
            fee_item = {
                "id": fee_data["id"],
                "membership_type": fee_data["membership_type"],
                "fee_amount": str(fee_data["fee_amount"]),
                "currency": fee_data["currency"],
                "gst_percentage": str(fee_data["gst_percentage"]),
                "min_age": fee_data["min_age"],
                "max_age": fee_data["max_age"],
                "experience": fee_data["experience"],
            }
            response_data.append(fee_item)
        
        return Response(response_data)


class MembershipFeeDetailAPIView(GenericAPIView):
    serializer_class = MembershipFeeSerializer

    def get_queryset(self):
        return MembershipFee.objects.all()

    def get(self, request, *args, **kwargs):
        membership_fee = self.get_queryset().get(id=kwargs['pk'])
        serializer = self.get_serializer(membership_fee)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        membership_fee = self.get_queryset().get(id=kwargs['pk'])
        serializer = self.get_serializer(membership_fee, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        membership_fee = self.get_queryset().get(id=kwargs['pk'])
        membership_fee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


#=========================payment================

razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class CreateOrderAPIView(APIView):
    def post(self, request):
        user = request.user
        
        proposers = Proposer.objects.filter(user=user)
        approved_count = proposers.filter(status="approved").count()
        total_required = 1  # Change if your business logic requires a different number
        if approved_count < total_required:
            return Response({
                "error": f"Membership application is not yet approved by required number of proposers. {approved_count} of {total_required} approvals received.",
                "is_verified": False,
                "approved_count": approved_count
            }, status=status.HTTP_400_BAD_REQUEST)
        
        
        membership_fee = user.membership_fee
        
        if not membership_fee:
            return Response({"error": "No membership fee associated with the user."}, status=status.HTTP_400_BAD_REQUEST)
        
        membership_type = membership_fee.membership_type
        if not membership_type:
            return Response({"error": "Membership type not available."}, status=status.HTTP_400_BAD_REQUEST)

        amount = membership_fee.fee_amount
        currency = membership_fee.currency.upper()
        
        if not amount or not currency:
            return Response({"error": "Invalid membership fee or currency."}, status=status.HTTP_400_BAD_REQUEST)

        if currency == "INR":
            amount_in_subunits = int(float(amount) * 100)  
        elif currency == "USD":
            amount_in_subunits = int(float(amount) * 100) 
        else:
            return Response({"error": f"Unsupported currency: {currency}"}, status=status.HTTP_400_BAD_REQUEST)


        # receipt_number = f"receipt_{int(time.time())}"
        receipt_number=generate_receipt_number()
        print("receipt number",receipt_number)

        order_data = {
            "amount": amount_in_subunits,
            "currency": currency,
            "payment_capture": 1,
            "receipt": receipt_number,
        }

        try:
            order = razorpay_client.order.create(order_data)
            print("order",order)
        except Exception as e:
            return Response({"error": f"Razorpay order creation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        Payment.objects.create(
            user=user,
            order_id=order['id'],
            receipt=receipt_number,
            membership_type=membership_type,
            amount=amount,
            currency=currency,
            status="Pending"
        )

        return Response({
            "status": status.HTTP_200_OK,
            "message": "Order created successfully",
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": settings.RAZORPAY_KEY_ID,
            "receipt": receipt_number,
            "fullname": user.name or "",  # Use name field
            "email": user.email or "",    # Use email field
            "phone": user.mobile_number or ""  # Use mobile_number field
        }, status=status.HTTP_200_OK)  


class RefundMembershipPaymentAPIView(APIView):
    permission_classes=[IsAdminUser]
    def post(self, request):
        user_id = request.query_params.get("user_id")
        
        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Step 1: Check if membership is explicitly rejected
        membership_record = ApproveMembership.objects.filter(applicant=user_id).order_by('-created_at').first()
        if not membership_record:
            return Response({"error": "No membership application found for this user."}, status=status.HTTP_404_NOT_FOUND)

        if not membership_record.rejected:
            return Response({"error": "Membership has not been rejected. Refund not applicable."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Check for payment
        try:
            payment = Payment.objects.filter(user=user_id,is_bank_verified=True).order_by('-created_at').first()
            print("1",payment)
            if not payment:
                return Response({"error": "No payment record found."}, status=status.HTTP_404_NOT_FOUND)
            print("2",payment.status)
            if payment.status.lower() not in ["paid", "success"]:
                return Response({
                    "error": f"Cannot refund payment with current status: {payment.status}",
                    "payment_status": payment.status
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Payment lookup failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        print("3",payment.order_id)
        
        
        # Step 3: Refund via Razorpay
        try:
            # Step 1: Fetch payment(s) for the order_id
            razorpay_payments = razorpay_client.order.payments(payment.order_id)
            payment_items = razorpay_payments.get("items", [])

            if not payment_items:
                return Response({"error": "No payment found under this order."}, status=404)

            # Step 2: Get the first successful payment_id
            payment_id = payment_items[0]["id"]  # first payment, assuming it's captured

            # Step 3: Issue refund using correct payment_id
            refund_response = razorpay_client.payment.refund(payment_id)
            refund_id = refund_response.get("id")

        except razorpay.errors.BadRequestError as e:
            return Response({"error": f"Refund initiation failed: {str(e)}"}, status=400)
        except Exception as e:
            return Response({"error": f"Unexpected refund error: {str(e)}"}, status=500)

        # Step 4: Verify refund status
        try:
            refund_verification = razorpay_client.refund.fetch(refund_id)
            refund_status = refund_verification.get("status")
            is_successful = refund_status == "processed"
        except Exception as e:
            return Response({
                "error": "Refund initiated but verification failed.",
                "refund_id": refund_id,
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Step 5: Update payment status
        payment.status = "Refunded" if is_successful else "Refund Initiated"
        payment.save()

        return Response({
            "status": status.HTTP_200_OK,
            "message": "Refund processed successfully" if is_successful else "Refund initiated but not yet processed",
            "refund_id": refund_id,
            "refund_status": refund_status,
            "amount_refunded": refund_verification.get("amount") / 100,
            "currency": refund_verification.get("currency"),
            "payment_id": payment.order_id,
            "is_successful": is_successful
        }, status=status.HTTP_200_OK)
     
        
class VerifyPaymentAPIView(APIView):
    def post(self, request):
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        try:
            razorpay_client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })

            payment = Payment.objects.get(order_id=razorpay_order_id)
            payment.status = "Success"
            payment.payment_id = razorpay_payment_id
            payment.save()

            # Send success confirmation email
            if payment.user and payment.user.email:
                try:
                    subject = "Payment Confirmation"
                    message = (
                        f"Dear {payment.user.name or 'Valued Member'},\n\n"
                        f"Thank you for your payment. Your membership application has been successfully processed.\n\n"
                        f"Payment Details:\n"
                        f"- Amount: {payment.amount} {payment.currency}\n"
                        f"- Membership Type: {payment.membership_type}\n"
                        f"- Order ID: {payment.order_id}\n"
                        f"- Payment ID: {payment.payment_id}\n\n"
                        f"If you have any questions, please contact us at {settings.DEFAULT_FROM_EMAIL}.\n\n"
                        f"Best regards,\nYour Organization Team"
                    )
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[payment.user.email],
                        fail_silently=True,
                    )
                    logger.info(f"Sent success email to {payment.user.email} for order {razorpay_order_id}")
                except Exception as e:
                    logger.error(f"Failed to send success email to {payment.user.email}: {str(e)}")

            return Response({"message": "Payment successful!", "status": status.HTTP_200_OK}, status=200)

        except razorpay.errors.SignatureVerificationError:
            try:
                payment = Payment.objects.get(order_id=razorpay_order_id)
                payment.status = "Failed"
                payment.payment_id = razorpay_payment_id
                payment.save()

                # Send failure notification email
                if payment.user and payment.user.email:
                    try:
                        subject = "Payment Failure Notification"
                        message = (
                            f"Dear {payment.user.name or 'Valued Member'},\n\n"
                            f"We regret to inform you that your payment attempt was unsuccessful due to a verification issue.\n\n"
                            f"Payment Details:\n"
                            f"- Order ID: {payment.order_id}\n"
                            f"- Amount: {payment.amount} {payment.currency}\n"
                            f"- Membership Type: {payment.membership_type}\n\n"
                            f"Please try again or contact us at {settings.DEFAULT_FROM_EMAIL} for assistance.\n\n"
                            f"Best regards,\nYour Organization Team"
                        )
                        send_mail(
                            subject=subject,
                            message=message,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[payment.user.email],
                            fail_silently=True,
                        )
                        logger.info(f"Sent failure email to {payment.user.email} for order {razorpay_order_id}")
                    except Exception as e:
                        logger.error(f"Failed to send failure email to {payment.user.email}: {str(e)}")
            except Payment.DoesNotExist:
                pass  # Handled in the outer except block

            return Response({"message": "Payment verification failed!"}, status=400)

        except Payment.DoesNotExist:
            # Log for admin review, no user email
            logger.warning(f"Payment record not found for order {razorpay_order_id}")
            return Response({"message": "Payment record not found!"}, status=404)

#=========================documents====================================
class DocumentAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    MAX_FILE_SIZE = 7.5 * 1024 * 1024  # 7.5 MB

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def _check_file_sizes(self, files):
        """
        Returns (field_name, file) if any file > MAX_FILE_SIZE, else None.
        """
        for field_name, file in files.items():
            if file.size > self.MAX_FILE_SIZE:
                return field_name, file
        return None

    def get(self, request):
        qs = self.get_queryset()
        doc_id = request.query_params.get("id")
        if doc_id:
            try:
                doc = qs.get(id=doc_id)
            except Document.DoesNotExist:
                raise NotFound("Document not found")
            data = DocumentSerializer(doc).data
        else:
            data = DocumentSerializer(qs, many=True).data
        return Response({"status": "success", "data": data})

    def post(self, request):
        # File size check on uploaded files only
        too_big = self._check_file_sizes(request.FILES)
        if too_big:
            field, _ = too_big
            return Response({
                "status": "error",
                "message": f"'{field}' exceeds the 7.5 MB size limit."
            }, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        # Serializer will pull fields from request.data and request.FILES
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            # Attach user here instead of putting it in the data dict
            serializer.save(user=request.user)
            return Response({
                "status": "success",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        qs = self.get_queryset()
        doc_id = request.data.get("id")
        if not doc_id:
            return Response({
                "status": "error",
                "message": "Document 'id' is required for update."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            doc = qs.get(id=doc_id)
        except Document.DoesNotExist:
            raise NotFound("Document not found")

        too_big = self._check_file_sizes(request.FILES)
        if too_big:
            field, _ = too_big
            return Response({
                "status": "error",
                "message": f"'{field}' exceeds the 7.5 MB size limit."
            }, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        serializer = DocumentSerializer(doc, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()  # user remains unchanged
            return Response({
                "status": "success",
                "data": serializer.data
            })
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        qs = self.get_queryset()
        doc_id = request.query_params.get("id") or request.data.get("id")
        if not doc_id:
            return Response({
                "status": "error",
                "message": "Document 'id' is required for deletion."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            doc = qs.get(id=doc_id)
        except Document.DoesNotExist:
            raise NotFound("Document not found")

        doc.delete()
        return Response({
            "status": "success",
            "message": "Document deleted successfully."
        }, status=status.HTTP_204_NO_CONTENT)


class PaymentListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        payment_id = request.data.get("id")

        if user.is_superuser:
            queryset = Payment.objects.all().order_by('-created_at')
        else:
            queryset = Payment.objects.filter(user=user).order_by('-created_at')

        if payment_id:
            try:
                payment = queryset.get(id=payment_id)
            except Payment.DoesNotExist:
                return Response({"message": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

            serializer = PaymentSerializer(payment)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if not queryset.exists():
            return Response({"message": "No payment records found."}, status=status.HTTP_200_OK)


        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PaymentSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    
class ApplicationPreviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        personal_details = UpdatePersonalDetailsSerializer(user).data
        qualifications = QualificationSerializer(user.qualifications.all(), many=True).data
        experiences = ExperienceSerializer(user.experiences.all(), many=True).data
        proposers = ProposersSerializer(user.proposer.all(), many=True).data
        documents = (
            DocumentSerializer(user.document.first()).data
            if user.document.exists()
            else None
        )
        membership_fee = (
            MembershipFeeSerializer(user.membership_fee).data
            if user.membership_fee
            else None
        )

        # Include proposer metadata stored in user
        proposer_metadata = {
            "area_of_specialization": user.area_of_specialization,
            "electronics_experience": user.electronics_experience,
            "exposure": user.exposure,
            "proposers": proposers
        }

        return Response({
            "status": status.HTTP_200_OK,
            "message": "Application preview fetched successfully.",
            "data": {
                "personal_details": personal_details,
                "qualifications": qualifications,
                "experiences": experiences,
                "proposers": proposer_metadata,
                "documents": documents,
                "membership_fee": membership_fee
            }
        }, status=status.HTTP_200_OK)
    
class PaymentStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            payment = Payment.objects.filter(user=request.user).latest("created_at")
            return Response({
                "paymentCompleted": payment.status == "Success",
                "status": payment.status
            })
        except Payment.DoesNotExist:
            return Response({"paymentCompleted": False, "status": "Pending"})
        
   
class AuditLogListAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logs = AuditLog.objects.all().order_by('-timestamp')

        # ✅ Search filter
        search = request.GET.get('search')
        if search:
            logs = logs.filter(
                Q(user__username__icontains=search) |
                Q(model_name__icontains=search) |
                Q(action__icontains=search) |
                Q(ip_address__icontains=search)
            )

        # ✅ Ordering
        ordering = request.GET.get('ordering')
        if ordering in ['timestamp', '-timestamp', 'model_name', '-model_name', 'action', '-action']:
            logs = logs.order_by(ordering)

        # ✅ Pagination
        page = request.GET.get('page', 1)
        page_size = int(request.GET.get('page_size', 20))
        paginator = Paginator(logs, page_size)
        current_page = paginator.get_page(page)

        serializer = AuditLogSerializer(current_page.object_list, many=True)

        return Response({
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': current_page.number,
            'results': serializer.data
        })
    

class AdminLogListAPIView(APIView):
    permission_classes=[IsAdminUser]
    def get(self, request):
        logs = AuditLog.objects.select_related('user').order_by('-timestamp')
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)
    


class MemberReportView(APIView):
    permission_classes = [IsAuthenticated,IsAdminUser]
    
    def get(self, request, *args, **kwargs):
        export_format = request.query_params.get("type")

        ext = {
            "csv": "csv",
            "excel": "xlsx",
            "pdf": "pdf"
        }[export_format]

        file_path = os.path.join(settings.MEDIA_ROOT, "reports", f"members.{ext}")
        print(file_path)

        if not os.path.exists(file_path):
            return Response({"detail": f"No file found for format '{export_format}'."}, status=404)

        content_type = {
            "csv": "text/csv",
            "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "pdf": "application/pdf"
        }[export_format]

        return FileResponse(
            open(file_path, "rb"),
            content_type=content_type,
            as_attachment=True,
            filename=f"members.{ext}"
        )
    
    def post(self, request, *args, **kwargs):
        export_format = request.data.get("format")
        requested_fields = request.data.get("fields", [])
        
        all_fields = [
            f.name for f in User._meta.get_fields()
            if not f.is_relation and f.name not in ["password", "last_login", "is_superuser"]
        ]

        if requested_fields:
            if not isinstance(requested_fields, list):
                return Response({"detail": "Fields must be a list."}, status=400)
            for field in requested_fields:
                if field not in all_fields:
                    return Response({"detail": f"Invalid field '{field}'."}, status=400)
            fields = requested_fields
        else:
            fields = all_fields

        name_filter = request.query_params.get("name")
        queryset = User.objects.all()
        if name_filter:
            queryset = queryset.filter(name__icontains=name_filter)
            
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        try:
            if start_date:
                start_date_obj = parse_date(start_date)
                if start_date_obj:
                    queryset = queryset.filter(created_at__gte=start_date_obj)

            if end_date:
                end_date_obj = parse_date(end_date)
                if end_date_obj:
                    queryset = queryset.filter(created_at__lte=end_date_obj)
        except Exception as e:
            return Response({"detail": f"Invalid date format. Use YYYY-MM-DD. Error: {str(e)}"}, status=400)


        if export_format not in ["csv", "excel", "pdf"]:
            return Response({"detail": "Invalid format. Use 'csv', 'excel' or 'pdf'."}, status=400)
            
        if export_format == "csv":
            buffer = generate_csv_response(queryset, fields)
            response = HttpResponse(buffer, content_type="text/csv")
            response['Content-Disposition'] = 'attachment; filename=members.csv'
            return response

        elif export_format == "excel":
            buffer = generate_excel_response(queryset, fields)
            response = HttpResponse(buffer, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            response['Content-Disposition'] = 'attachment; filename=members.xlsx'
            return response
        
        elif export_format == "pdf":
            buffer = generate_pdf_response(queryset, fields)
            response = HttpResponse(buffer, content_type="application/pdf")
            response['Content-Disposition'] = f'attachment; filename=members.pdf'
            return response

        return Response({"detail": "Invalid format. Use 'csv' or 'excel'."}, status=400)


#-------------------Multi-Leval configuration API----------------------------------
class ConfigSettingAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        config_id = request.query_params.get("id")
        config_type = request.query_params.get("type")

        if config_id:
            config = ConfigSetting.objects.prefetch_related("approval_user").filter(id=config_id).first()
            if not config:
                return Response({"detail": "Config not found."}, status=404)
            serializer = ConfigSettingSerializer(config)
            return Response(serializer.data, status=200)

        if config_type:
            configs = ConfigSetting.objects.prefetch_related("approval_user").filter(type=config_type)
        else:
            configs = ConfigSetting.objects.prefetch_related("approval_user").all()

        serializer = ConfigSettingSerializer(configs, many=True)
        return Response(serializer.data, status=200)

    def post(self, request):
        approval_user_ids = request.data.get("approval_user_ids", [])
        title = request.data.get("title")
        ctype = request.data.get("type")
        approval_prsnt = request.data.get("approval_prsnt")
        heirarchy = request.data.get("heirarchy", False)

        if not approval_user_ids:
            return Response({"detail": "approval_user_ids is required."}, status=400)

        users = User.objects.filter(id__in=approval_user_ids)
        if not users.exists():
            return Response({"detail": "No valid users found."}, status=400)

        config = ConfigSetting.objects.create(
            title=title,
            type=ctype,
            approval_prsnt=approval_prsnt,
            heirarchy=heirarchy,
            value={}  # We'll populate it below
        )
        config.approval_user.set(users)

        value_dict = {}
        for user in users:
            key = f"{user.name}_{user.role.name if user.role else 'unknown'}"
            value_dict[key] = {"source": "manual", "status": "pending"}

        config.value = value_dict
        config.save()

        approval_users = [
            {"id": str(user.id), "name": user.name, "role": user.role.name if user.role else None}
            for user in users
        ]

        return Response({
            "id": config.id,
            "type": ctype,
            "title": title,
            "approval_prsnt": approval_prsnt,
            "heirarchy": heirarchy,
            "approval_users": approval_users
        }, status=201)

    def patch(self, request):
        config_id = request.query_params.get("id")
        config_type = request.query_params.get("type", request.data.get("type", "membership"))

        if not config_id or not config_type:
            return Response({"detail": "Config ID and type are required."}, status=400)

        try:
            config = ConfigSetting.objects.get(id=config_id, type=config_type)
        except ConfigSetting.DoesNotExist:
            return Response({"detail": "ConfigSetting not found."}, status=404)

        approval_user_ids = request.data.get("approval_user_ids", [])
        title = request.data.get("title")
        ctype = request.data.get("type")
        approval_prsnt = request.data.get("approval_prsnt")
        heirarchy = request.data.get("heirarchy")
        value = request.data.get("value")

        users = User.objects.filter(id__in=approval_user_ids)

        if approval_user_ids and not users.exists():
            return Response({"detail": "No valid users found."}, status=400)

        if approval_user_ids:
            config.approval_user.set(users)

            value_dict = {}
            for user in users:
                key = f"{user.name}_{user.role.name if user.role else 'unknown'}"
                value_dict[key] = {"status": "pending"}
            config.value = value_dict

        if title is not None:
            config.title = title
        if ctype is not None:
            config.type = ctype
        if approval_prsnt is not None:
            config.approval_prsnt = approval_prsnt
        if heirarchy is not None:
            config.heirarchy = heirarchy
        if value is not None:
            config.value = value

        config.save()

        approval_users = [
            {"id": str(user.id), "name": user.name, "role": user.role.name if user.role else None}
            for user in config.approval_user.select_related("role").all()
        ]

        return Response({
            "id": config.id,
            "type": config.type,
            "title": config.title,
            "value":config.value,
            "approval_prsnt": config.approval_prsnt,
            "heirarchy": config.heirarchy,
            "approval_users": approval_users
        }, status=200)



def build_role_chain_from_bottom(roles):
    """
    Return a list of role IDs ordered from bottom to top of the hierarchy.
    - Follows parent-child links.
    - Includes orphan roles (no parent or child).
    """
    visited = set()
    chain = []

    def add_chain(role):
        # Walk up to the top of the parent chain
        while role and role.id not in visited:
            visited.add(role.id)
            chain.append(role.id)
            role = role.parent

    for role in roles:
        add_chain(role)

    # Preserve order: bottom to top, remove duplicates while keeping insertion order
    seen = set()
    ordered_chain = []
    for rid in chain:
        if rid not in seen:
            seen.add(rid)
            ordered_chain.append(rid)

    return ordered_chain

class ApproveMembershipAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        applicant_id = request.data.get("applicant_id")
        config_type = request.data.get("type", "membership")
        approved = request.data.get("approved", True)
        current_user_remark = request.data.get("remark", "").strip()

        if not applicant_id:
            return Response({"detail": "applicant_id is required."}, status=400)

        applicant = get_object_or_404(User, id=applicant_id)
        config = ConfigSetting.objects.filter(type=config_type).prefetch_related("approval_user").first()

        if not config:
            return Response({"detail": "Approval configuration not found."}, status=400)

        approvers = list(config.approval_user.all())
        total_approvers = len(approvers)

        if request.user.id not in [u.id for u in approvers]:
            return Response({"detail": "You are not authorized to act on this membership."}, status=403)

        if ApproveMembership.objects.filter(applicant=applicant).exists():
            return Response({"detail": "Membership already finalized."}, status=400)

        # Step 1: Record vote and remark
        value_data = config.value if isinstance(config.value, dict) else {}
        applicant_key = str(applicant_id)
        user_key = str(request.user.id)

        current_record = value_data.get(applicant_key, {})
        current_record[user_key] = True if approved else False

        # Store or update individual remarks under a special key
        remarks_record = current_record.get("remarks", {})
        if current_user_remark:
            remarks_record[user_key] = current_user_remark
        current_record["remarks"] = remarks_record

        value_data[applicant_key] = current_record
        config.value = value_data
        config.save(update_fields=["value"])

        # Step 2: Calculate approval %
        approved_count = sum(1 for k, v in current_record.items() if k != "remarks" and v is True)
        approval_percent = (approved_count / total_approvers) * 100
        threshold = config.approval_prsnt
        finalize = False

        # Step 3: Hierarchy approval logic
        if config.heirarchy:
            role_to_users = {}
            for user in approvers:
                if user.role:
                    role_to_users.setdefault(user.role.id, []).append(user)

            user_roles = [user.role for user in approvers if user.role]
            role_chain = build_role_chain_from_bottom(user_roles)
            acted_ids = set(k for k in current_record if k != "remarks")

            for i, role_id in enumerate(role_chain):
                role_users = role_to_users.get(role_id, [])
                ids_needed = {str(u.id) for u in role_users}

                if not ids_needed:
                    continue

                if not ids_needed.issubset(acted_ids):
                    for u in role_users:
                        if str(u.id) not in acted_ids:
                            subject, msg = notify_pending_approver(u.name, applicant.name)
                            notify_user(u, msg, subject)
                    break
                # else:
                #     if i + 1 < len(role_chain):
                #         next_role_id = role_chain[i + 1]
                #         next_users = role_to_users.get(next_role_id, [])
                #         for u in next_users:
                #             if str(u.id) not in acted_ids:
                #                 subject, msg = notify_pending_approver(u.name, applicant.name)
                #                 notify_user(u, msg, subject)
                #         break
            else:
                if approval_percent >= threshold:
                    finalize = True
        else:
            for u in approvers:
                if str(u.id) not in current_record:
                    subject, msg = notify_pending_approver(u.name, applicant.name)
                    notify_user(u, msg, subject)
                    
            if approval_percent >= threshold:
                finalize = True

        # Step 4: Finalize if eligible
        if finalize:
            with transaction.atomic():
                payment = Payment.objects.filter(user=applicant).order_by('-id').first()
                if not payment or not payment.membership_type:
                    return Response({"detail": "Membership type not found in payment."}, status=400)

                currency = payment.currency or "INR"
                membership_fee = MembershipFee.objects.filter(
                    currency=currency,
                    membership_type__icontains=payment.membership_type.strip()
                ).first()

                if not membership_fee:
                    return Response({
                        "detail": f"No matching membership fee found for type '{payment.membership_type}' and currency '{currency}'."
                    }, status=400)

                membership_type = membership_fee.membership_type  # KEEP AS-IS (may contain quotes)

                if applicant.membership_id:
                    membership_id = applicant.membership_id
                else:
                    prefix = "".join(word[0].upper() for word in re.findall(r'\b\w+', membership_type)) + "-"
                    latest_user = (
                        User.objects
                        .filter(membership_id__startswith=prefix)
                        .exclude(membership_id__isnull=True)
                        .order_by("-membership_id")
                        .first()
                    )
                    last_number = 0
                    if latest_user and latest_user.membership_id:
                        try:
                            last_number = int(latest_user.membership_id.split("-")[1])
                        except (IndexError, ValueError):
                            last_number = 0
                    new_number = last_number + 1
                    membership_id = f"{prefix}{new_number:06d}"
                    applicant.membership_id = membership_id

                try:
                    final_role = Role.objects.get(name__iexact=membership_type)
                except Role.DoesNotExist:
                    return Response({"detail": f"Role '{membership_type}' not found."}, status=400)

                applicant.role = final_role
                applicant.save(update_fields=["role", "membership_id"])

                # Step 5: Combine all remarks
                remarks_record = current_record.get("remarks", {})
                all_remarks = []
                for approver in approvers:
                    uid = str(approver.id)
                    if current_record.get(uid) is True:
                        remark = remarks_record.get(uid, "").strip()
                        if remark:
                            all_remarks.append(f"{approver.name}: {remark}")
                combined_remark = "\n".join(all_remarks)

                # Step 6: Save final approval
                membership = ApproveMembership.objects.create(
                    applicant=applicant,
                    approved=True,
                    remark=combined_remark
                )
                approved_user_ids = [uid for uid in current_record if uid != "remarks" and current_record[uid] is True]
                membership.approved_by.set(User.objects.filter(id__in=approved_user_ids))

                # Step 7: Reset config value
                config.value = {}
                config.save(update_fields=["value"])

                # Step 8: Notify
                subject, msg = membership_finalized_email(applicant.name, membership_id, final_role.name)
                notify_user(applicant, msg, subject)

                for approver in approvers:
                    subject, msg = approver_notification_email(approver.name, applicant.name, membership_id)
                    notify_user(approver, msg, subject)

            return Response({
                "success": True,
                "message": "Membership finalized.",
                "approval_percent": round(approval_percent, 2),
                "membership_id": membership_id,
                "finalized_by": request.user.name,
                "approvers_status": current_record
            })
            
        # Save rejection record if rejected and not yet finalized
        if not approved:
            rejected_remarks = current_record.get("remarks", {})
            all_remarks = []
            for approver in approvers:
                uid = str(approver.id)
                if current_record.get(uid) is False:
                    remark = rejected_remarks.get(uid, "").strip()
                    if remark:
                        all_remarks.append(f"{approver.name}: {remark}")
            combined_rejected_remark = "\n".join(all_remarks)

            ApproveMembership.objects.create(
                applicant=applicant,
                approved=False,
                rejected=True,
                remark=combined_rejected_remark
            )

        # Step 5: Notify applicant about interim status
        subject, message = applicant_interim_status_email(applicant.name, request.user.name, approved)
        notify_user(applicant, message, subject)
        
        return Response({
            "success": True,
            "message": f"{'Approved' if approved else 'Rejected'} recorded.",
            "approval_percent": round(approval_percent, 2),
            "action_by": request.user.name,
            "approvers_status": current_record
        }, status=200)



class ApplicationListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        user, error_response = check_permission_and_get_access(request, "api_v1.view_user")
        if error_response:
            return error_response
        
        
        
        applicants = User.objects.filter(is_active=True, membership_id__isnull=True).order_by('-created_at')

        result = []

        for applicant in applicants:
            approval = ApproveMembership.objects.filter(applicant=applicant).first()
            doc = Document.objects.filter(user=applicant).first()
            qualifications = Qualification.objects.filter(user=applicant)
            experiences = Experience.objects.filter(user=applicant)
            proposers = Proposer.objects.filter(user=applicant)

            payment_details = applicant.payment_details or {}
            transaction_id = payment_details.get("txn_id")
            payment_status = payment_details.get("status", "Pending")

            try:
                verification = ApplicationVerificationStatus.objects.get(user=applicant)
            except ApplicationVerificationStatus.DoesNotExist:
                verification = None

            result.append({
                "id": applicant.application_id,
                "user_id": str(applicant.id),
                "name": applicant.name,
                "email": applicant.email,
                "phone": applicant.mobile_number,
                "address": f"{applicant.address1 or ''}, {applicant.address2 or ''}, {applicant.address3 or ''}".strip(', '),
                "gender": applicant.gender,
                "date_of_birth": str(applicant.date_of_birth) if applicant.date_of_birth else None,
                "city": applicant.city,
                "state": applicant.state,
                "country": applicant.country,
                "pincode": applicant.pincode,
                "from_india": applicant.from_india,
                "spouse_name": applicant.spouse_name,
                "father_name": applicant.father_name,
                "mother_name": applicant.mother_name,

                "academic": [
                    {
                        "degree": q.qualification_type.name if q.qualification_type else "",
                        "branch": q.qualification_branch.name if q.qualification_branch else "",
                        "institute": q.institute_name,
                        "board": q.board_university,
                        "year": q.year_of_passing,
                        "percentage_cgpa": q.percentage_cgpa,
                        "document": q.document.url if q.document else ""
                    } for q in qualifications
                ],
                "experience": [
                    {
                        "organization_name": e.organization_name,
                        "job_title": e.job_title,
                        "employee_type": e.employee_type,
                        "work_type": e.work_type,
                        "start_date": str(e.start_date),
                        "end_date": str(e.end_date) if e.end_date else None,
                        "currently_working": e.currently_working,
                        "total_experience": e.total_experience,
                    } for e in experiences
                ],
                "proposers": [
                    {
                        "name": p.name,
                        "email": p.email,
                        "mobile_no": p.mobile_no,
                        "membership_no": p.membership_no,
                    } for p in proposers
                ],
                "membership": {
                    "plan": applicant.membership_fee.membership_type if applicant.membership_fee else "N/A",
                    "startDate": str(applicant.created_at.date())
                },
                "documents": [
                    {
                        "name": "Aadhar Front",
                        "url": doc.aadhar_front.url if doc and doc.aadhar_front else "",
                        "uploadedAt": str(doc.updated_at.date()) if doc and doc.aadhar_front else None
                    },
                    {
                        "name": "Aadhar Back",
                        "url": doc.aadhar_back.url if doc and doc.aadhar_back else "",
                        "uploadedAt": str(doc.updated_at.date()) if doc and doc.aadhar_back else None
                    },
                    {
                        "name": "Passport",
                        "url": doc.passport.url if doc and doc.passport else "",
                        "uploadedAt": str(doc.updated_at.date()) if doc and doc.passport else None
                    },
                    {
                        "name": "Profile Photo",
                        "url": doc.profile_photo.url if doc and doc.profile_photo else "",
                        "uploadedAt": str(doc.updated_at.date()) if doc and doc.profile_photo else None
                    },
                    {
                        "name": "Signature",
                        "url": doc.signature.url if doc and doc.signature else "",
                        "uploadedAt": str(doc.updated_at.date()) if doc and doc.signature else None
                    },
                ],
                "eligibility": {
                    "status": (
                        "Approved" if approval and approval.approved else
                        "Rejected" if approval and approval.rejected else
                        "Pending"
                    ),
                    "notes": applicant.eligibility or ""
                },
                "payment": {
                    "status": payment_status,
                    "transaction_id": transaction_id,
                    "amount": payment_details.get("amount"),
                    "method": payment_details.get("method"),
                    "timestamp": str(applicant.updated_at),
                },
                "applicationSteps": {
                    "personalDetails": {
                        "completed": verification.personal_details if verification else False,
                        "timestamp": str(applicant.created_at)
                    },
                    "qualification": {
                        "completed": verification.qualification if verification else False,
                        "timestamp": str(qualifications.latest("created_at").created_at) if qualifications.exists() else None
                    },
                    "experience": {
                        "completed": verification.experience if verification else False,
                        "timestamp": str(experiences.latest("created_at").created_at) if experiences.exists() else None
                    },
                    "proposer": {
                        "completed": verification.proposer if verification else False,
                        "timestamp": None
                    },
                    "membershipSelection": {
                        "completed": verification.membership if verification else False,
                        "timestamp": str(applicant.updated_at)
                    },
                    "documents": {
                        "completed": verification.documents if verification else False,
                        "timestamp": str(doc.updated_at) if doc else None
                    },
                    "eligibilityCheck": {
                        "completed": verification.eligibility if verification else False,
                        "timestamp": str(approval.updated_at) if approval else None
                    },
                    "payment": {
                        "completed": verification.payment if verification else False,
                        "timestamp": str(applicant.updated_at),
                        "status": payment_status,
                        "transactionId": transaction_id
                    },
                    "formPreview": {
                        "completed": False,
                        "timestamp": None
                    }
                }
            })

        return Response(result)

    def post(self, request):
        user, error_response = check_permission_and_get_access(request, "api_v1.add_user")
        if error_response:
            return error_response

        user_id = request.query_params.get("user_id")
        # user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "User ID is required."}, status=400)

        user = get_object_or_404(User, id=user_id)

        verification_data = {
            "user_id": str(user.id),
            "personal_details": request.data.get("personal_details", False),
            "qualification": request.data.get("qualification", False),
            "experience": request.data.get("experience", False),
            "proposer": request.data.get("proposer", False),
            "membership": request.data.get("membership", False),
            "documents": request.data.get("documents", False),
            "payment": request.data.get("payment", False),
            "eligibility": request.data.get("eligibility", False),
        }

        try:
            obj, _ = ApplicationVerificationStatus.objects.update_or_create(
                user=user, defaults=verification_data
            )
            return Response({
                "message": "Verification status saved successfully.",
                "data": ApplicationVerificationStatusSerializer(obj).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        user, error_response = check_permission_and_get_access(request, "api_v1.change_user")
        if error_response:
            return error_response

        # user_id = request.query_params.get("user_id")
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "User ID is required."}, status=400)

        user = get_object_or_404(User, id=user_id)

        try:
            verification = ApplicationVerificationStatus.objects.get(user=user)
        except ApplicationVerificationStatus.DoesNotExist:
            return Response({"error": "Verification status not found for this user."}, status=404)

        update_fields = [
            "personal_details", "qualification", "experience", "proposer",
            "membership", "documents", "payment", "eligibility"
        ]

        for field in update_fields:
            if field in request.data:
                setattr(verification, field, request.data[field])

        verification.save()

        return Response({
            "message": "Verification status updated successfully.",
            "data": ApplicationVerificationStatusSerializer(verification).data
        }, status=status.HTTP_200_OK)


class CertificateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        name = request.query_params.get("name", "").strip()
        email_param = request.query_params.get("email", "").strip()

        if not name:
            return Response({"detail": "Name is required."}, status=400)

        users = User.objects.filter(name__iexact=name)

        if not users.exists():
            return Response({"detail": "No user found with this name."}, status=404)

        if users.count() > 1:
            if not email_param:
                return Response({
                    "detail": f"Multiple users found with name '{name}'. Please provide email to identify the user."
                }, status=400)
            try:
                user = users.get(email__iexact=email_param)
            except User.DoesNotExist:
                return Response({
                    "detail": f"No user found with name '{name}' and email '{email_param}'."
                }, status=404)
            except User.MultipleObjectsReturned:
                return Response({
                    "detail": f"Multiple users found with name '{name}' and email '{email_param}'. Please contact admin."
                }, status=400)
        else:
            user = users.first()

        return self.send_certificate_link_email(request, user)

    def send_certificate_link_email(self, request, user):
        try:
            certificate_number = f"CERT-{uuid.uuid4().hex[:8].upper()}"
            certificate_url = request.build_absolute_uri(
                reverse("view-certificate", kwargs={"user_id": user.id})
            )

            email = EmailMessage(
                subject="Your Membership Certificate",
                body=(
                    f"Dear {user.name},\n\n"
                    f"Your membership certificate is ready!\n\n"
                    f"View and print it here:\n{certificate_url}\n\n"
                    "Use Ctrl+P to print or save it as PDF.\n\n"
                    "Thank you."
                ),
                from_email="noreply@yourdomain.com",
                to=[user.email],
            )
            email.send()

            return Response({
                "user_id": user.id,
                "email": user.email,
                "status": "success",
                "certificate_number": certificate_number,
                "certificate_url": certificate_url,
                "message": "Certificate link emailed successfully."
            }, status=200)

        except Exception as e:
            return Response({
                "user_id": user.id,
                "email": user.email,
                "status": "failed",
                "reason": f"Email sending error: {str(e)}"
            }, status=500)



class ApprovalStatus(APIView):
    
    def get_remark_for_approver(self,remark_text, approver_name):
        if not remark_text or not approver_name:
            return ""
        lines = remark_text.splitlines()
        for line in lines:
            if line.strip().startswith(f"{approver_name}:"):
                return line.strip()
        return ""

    def get(self, request):
        status_param = request.query_params.get("status", "all")

        if status_param not in ['approved', 'rejected', 'all']:
            return Response(
                {"message": "Invalid 'status'. Must be 'approved', 'rejected', or 'all'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if status_param == 'approved':
            queryset = ApproveMembership.objects.filter(approved=True)
        elif status_param == 'rejected':
            queryset = ApproveMembership.objects.filter(rejected=True)
        else:
            queryset = ApproveMembership.objects.filter(approved=True) | ApproveMembership.objects.filter(rejected=True)

        if not queryset.exists():
            return Response(
                {"message": f"No {status_param} records found."},
                status=status.HTTP_404_NOT_FOUND
            )

        result = []

        for membership in queryset.prefetch_related("approved_by", "applicant__role"):
            applicant = membership.applicant
            approvers = membership.approved_by.all()
            remark = membership.remark or ""

            result.append({
                "applicant_id": str(applicant.id),
                "applicant_name": applicant.name or applicant.get_full_name() or "",
                "success": membership.approved,
                "approved_by": [
                    {
                        "id": str(approver.id),
                        "name": approver.name or approver.last_name or "",
                        "role": getattr(approver.role, "name", ""),
                        "remarks": self.get_remark_for_approver(remark, approver.name)
                    }
                    for approver in approvers
                ]
            })

        return Response(result, status=status.HTTP_200_OK)



class UserIDCardAndCertificateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.membership_id and not user.role:
            return HttpResponse("You are not eligible for an ID card or certificate.", status=403)

        # Optional type param
        output_type = request.query_params.get("type", "").lower()  # idcard / certificate / both

        fallback_image = request.build_absolute_uri(static('images/user.png'))
        signature_url = request.build_absolute_uri('/static/images/signature.png')
        avatar = request.build_absolute_uri(user.avatar.url) if user.avatar else fallback_image

        membership_id = user.membership_id or "G-000002"
        if membership_id.startswith("AM-"):
            header_class = "header-green"
        elif membership_id.startswith("F-"):
            header_class = "header-blue"
        elif membership_id.startswith("M-"):
            header_class = "header-red"
        else:
            header_class = "header-default"

        fee = MembershipFee.objects.filter(user=user).first()
        membership_type = fee.membership_type if fee else None
        final_membership_type = membership_type or (user.role.name if user.role else None)

        context = {
            "name": user.name,
            "membership_id": membership_id,
            "user_image_url": avatar,
            "enroll_date": user.created_at,
            "date_of_birth": user.date_of_birth,
            "authorization_signature_url": signature_url,
            "header_class": header_class,
            "membership_type": final_membership_type,
        }

        if output_type == "idcard":
            id_card_html = render_to_string("test.html", context)
            return HttpResponse(f"<html><head><meta charset='UTF-8'></head><body>{id_card_html}</body></html>")

        elif output_type == "certificate":
            certificate_html = render_to_string("certificate.html", context)
            return HttpResponse(f"<html><head><meta charset='UTF-8'></head><body>{certificate_html}</body></html>")

        else:
            id_card_html = render_to_string("test.html", context)
            certificate_html = render_to_string("certificate.html", context)
            separator_html = "<div style='margin: 30px 0; padding: 0; border-top: 1px dashed #333;'></div>"

            full_html = f"""
                <html>
                    <body>
                        {id_card_html}
                        {separator_html}
                        {certificate_html}
                    </body>
                </html>
                """
            return HttpResponse(full_html)     
        
        
def send_payment_receipt_email(user, payment, request):
    receipt_id = payment.id
    receipt_link = request.build_absolute_uri(
        f"/api/v1/payment-receipt/?receipt_no={receipt_id}"
    )

    subject = "Your Payment Receipt - IETE"
    html_content = f"""
        <p>Dear {user.name},</p>
        <p>Thank you for your payment of ₹{payment.amount:.0f}.</p>
        <p>You can view and download your official payment receipt here:</p>
        <p><a href="{receipt_link}" target="_blank">{receipt_link}</a></p>
        <br>
        <p>Regards,<br><strong>IETE Finance Team</strong></p>
    """

    email = EmailMessage(
        subject=subject,
        body=strip_tags(html_content), 
        to=[payment.user.email],
    )
    email.content_subtype = "html"
    email.send()


class PendingPaymentsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        pending_payments = Payment.objects.filter(status="Pending", user__isnull=False,is_bank_verified=False).select_related("user")
        data = []

        for p in pending_payments:
            try:
                data.append({
                    "id": p.id,
                    "user": p.user.email,
                    "amount": p.amount,
                    "status":p.status,
                    "bank_verify":p.is_bank_verified,
                    "order_id": p.order_id,
                    "created_at": p.created_at
                })
            except User.DoesNotExist:
                continue  # skip orphaned payment records

        return Response({"count": len(data), "payments": data})
    
    def post(self, request):
        payment_ids = request.data.get("payment_ids")
        if not payment_ids or not isinstance(payment_ids, list):
            return Response({"detail": "payment_ids must be a list."}, status=400)

        verified, failed = [], []
        for pid in payment_ids:
            try:
                payment = Payment.objects.get(id=pid, status="Pending",is_bank_verified=False)
                payment.status = "Success"
                payment.is_bank_verified = True
                payment.save()
                verified.append(pid)
            except Payment.DoesNotExist:
                failed.append({"payment_id": pid, "reason": "Not found or already verified"})

        return Response({"verified": verified, "failed": failed})


class PaymentReceiptsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        payment_ids = request.data.get("payment_ids",[])
        send_email = request.data.get("send_email", False)

        if not payment_ids or not isinstance(payment_ids, list):
            return Response({"detail": "payment_ids must be a list of IDs."}, status=400)

        receipts = []
        failures = []

        for pid in payment_ids:
            try:
                payment = Payment.objects.get(id=pid)
                print("1",payment)


            except Payment.DoesNotExist:
                failures.append({"payment_id": pid, "reason": "Payment not found"})
                continue


            # ✅ Step 1: Verify Payment
            payment.status = "Success"
            payment.save()

            # ✅ Step 2: Fee Breakdown
            app_fee = 1000
            adm_fee = 1000
            life_fee = 6000
            subs_fee = 0
            advance_fee = 0
            arrear_fee = 0
            gst_amount = float(payment.amount) - sum([app_fee, adm_fee, life_fee, subs_fee, advance_fee, arrear_fee])

            context = {
                "payment": payment,
                "app_fee": app_fee,
                "adm_fee": adm_fee,
                "life_fee": life_fee,
                "subs_fee": subs_fee,
                "advance_fee": advance_fee,
                "arrear_fee": arrear_fee,
                "gst_amount": gst_amount,
            }

            try:
                receipt_html = render(request, "receipt.html", context).content.decode()
            except Exception as e:
                failures.append({"payment_id": pid, "reason": "Template error", "error": str(e)})
                continue

            if send_email:
                try:
                    subject = "Your Payment Receipt"
                    email = EmailMessage(subject, "", to=[payment.user.email])
                    email.content_subtype = "html"
                    email.body = receipt_html
                    email.send()
                except Exception as e:
                    failures.append({"payment_id": pid, "reason": "Email failed", "error": str(e)})
                    continue

            receipts.append({
                "payment_id": pid,
                "user_email": payment.user.email,
                "receipt_html": receipt_html,
            })
            
        return Response({
            "total_requested": len(payment_ids),
            "verified_and_receipt_generated": len(receipts),
            "failed": len(failures),
            "receipts": receipts,
            "failures": failures
        })

#sms api
class SendOTPAPIView(APIView):
    def post(self, request):
        phone = request.data.get("phone")
        ip = request.META.get("REMOTE_ADDR")

        if not phone:
            return Response({"error": "Phone number is required"}, status=400)

        if get_otp_from_cache(phone):
            return Response({"error": "OTP already sent. Try again after 10 minutes."}, status=429)

        # if not increment_otp_count(phone):
        #     return Response({
        #         "error": "You have reached the OTP limit for today. Try again after 24 hours."
        #     }, status=429)

        otp = generate_otp()
        response = send_verification_otp(phone, otp)

        if response.get("status") == "error":
            return Response({"error": response.get("message")}, status=500)

        set_otp_in_cache(phone, otp)
        return Response({"message": "OTP sent successfully","ip address": ip}, status=200)

class VerifyOTPAPIView(APIView):
    def post(self, request):
        phone = request.data.get("phone")
        otp = request.data.get("otp")

        if not phone or not otp:
            return Response({"error": "Phone and OTP are required"}, status=400)

        cached_otp = get_otp_from_cache(phone)
        if not cached_otp:
            return Response({"error": "OTP expired or not found. Please request again."}, status=404)

        if otp != cached_otp:
            return Response({"error": "Invalid OTP"}, status=400)

        clear_otp_cache(phone)
        return Response({"message": "OTP verified successfully"})


class ApplicationTrackerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            # Fetch related data for the user
            doc = Document.objects.filter(user=user).first()
            approval = ApproveMembership.objects.filter(applicant=user).first()
            qualifications = Qualification.objects.filter(user=user)
            experiences = Experience.objects.filter(user=user)
            proposers = Proposer.objects.filter(user=user)
            payment = Payment.objects.filter(user=user).order_by('-created_at').first()

            # Determine verification status
            try:
                verification = ApplicationVerificationStatus.objects.get(user=user)
            except ApplicationVerificationStatus.DoesNotExist:
                verification = None

            # Payment details
            payment_details = payment.__dict__ if payment else {}
            transaction_id = payment_details.get("order_id")
            payment_status = payment_details.get("status", "Pending")
            amount = payment_details.get("amount", 0)

            # Determine application status
            if verification and verification.payment and payment_status == "Success" and approval and approval.approved:
                app_status = "Completed"
            elif verification and verification.payment and payment_status == "Pending":
                app_status = "Pending"
            else:
                app_status = "In Progress"

            # Approval status
            is_approved = approval.approved if approval else False

            # Format steps for FormTracker
            steps = [
                {
                    "id": "personalDetails",
                    "title": "Personal Details",
                    "status": "Completed" if verification and verification.personal_details else "Pending",
                    "date": str(user.created_at.date()) if verification and verification.personal_details else None
                },
                {
                    "id": "qualification",
                    "title": "Qualification",
                    "status": "Completed" if verification and verification.qualification else "Pending",
                    "date": str(qualifications.latest("created_at").created_at.date()) if qualifications.exists() and verification and verification.qualification else None
                },
                {
                    "id": "experience",
                    "title": "Experience",
                    "status": "Completed" if verification and verification.experience else "Pending",
                    "date": str(experiences.latest("created_at").created_at.date()) if experiences.exists() and verification and verification.experience else None
                },
                {
                    "id": "proposer",
                    "title": "Proposer",
                    "status": "Completed" if verification and verification.proposer else "Pending",
                    "date": str(user.updated_at.date()) if verification and verification.proposer else None
                },
                {
                    "id": "documents",
                    "title": "Documents",
                    "status": "Completed" if verification and verification.documents else "Pending",
                    "date": str(doc.updated_at.date()) if doc and verification and verification.documents else None
                },
                {
                    "id": "payment",
                    "title": "Payment",
                    "status": payment_status,
                    "date": str(user.updated_at.date()) if verification and verification.payment else None
                }
            ]

            # Construct response matching FormTracker expectations
            result = {
                "applicationNo": user.application_id or "N/A",
                "email": user.email,
                "userId": str(user.id) if user.membership_id else None,
                "username":user.name,
                "date": str(user.created_at.date()),
                "status": app_status,
                "isApproved": is_approved,
                "paymentStatus": payment_status,
                "amount": amount,
                "steps": steps
            }

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        
