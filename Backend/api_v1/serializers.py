from django.contrib.auth.password_validation import validate_password
from django.contrib.admin.models import LogEntry
from rest_framework import serializers
from .models import *
# from .models import Title  # Adjust import as needed

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'

class GroupSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    class Meta:
        model = Group
        fields = '__all__'

class MembershipFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipFee
        fields = '__all__'        

class RolelistSerializer(serializers.ModelSerializer):
    group=GroupSerializer(read_only=True)
    class Meta:
        model=Role
        fields='__all__'
        
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model=Role
        fields='__all__'
        
    def to_representation(self, instance):
        data = super().to_representation(instance)

        # ID as string
        data['id'] = str(instance.id)


        # Group as "uuid_groupname" if exists
        if instance.group:
            data['group'] = f"{instance.group.id}_{instance.group.name}"
        else:
            data['group'] = None

        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'mobile_number', 'name', "middle_name", "last_name", "exposure", "electronics_experience", "area_of_specialization"]

# class SignupSerializer(serializers.ModelSerializer):
#     confirm_password = serializers.CharField(write_only=True, required=True)

#     class Meta:
#         model = User
#         fields = ["name", "email", "password", "confirm_password", "mobile_number", "middle_name", "last_name", ]
#         extra_kwargs = {"password": {"write_only": True}}

#     def validate(self, data):
#         """Validates user input before creating a user"""
#         if data["password"] != data["confirm_password"]:
#             raise serializers.ValidationError({"password": "Passwords do not match."})

#         if User.objects.filter(email=data["email"]).exists():
#             raise serializers.ValidationError({"email": "Email already registered."})

#         return data

#     def create(self, validated_data):
#         """Creates a user and securely sets the password"""
#         validated_data.pop("confirm_password")
#         user = User(
#             name=validated_data["name"],
#             email=validated_data["email"],
#             mobile_number=validated_data["mobile_number"],
#             is_active=False  # User is inactive until OTP is verified
#         )
#         user.set_password(validated_data["password"])  # Securely set password
#         user.save()
#         return user

class SignupSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "name", "email", "password", "confirm_password",
            "mobile_number", "middle_name", "last_name"
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, data):
        """Validates password confirmation only"""
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        """Creates an inactive user"""
        validated_data.pop("confirm_password")
        user = User(
            name=validated_data["name"],
            email=validated_data["email"],
            mobile_number=validated_data["mobile_number"],
            middle_name=validated_data.get("middle_name"),
            last_name=validated_data.get("last_name"),
            is_active=False
        )
        user.set_password(validated_data["password"])
        user.save()
        return user





class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data
    

from uuid import UUID

# PROTECTED_ROLES = ["Super Admin", "Admin", "Gen Co", "Sec Gen", "Member", "Fellow Member", "Associate Member"]


class EmployeeSerializer(serializers.ModelSerializer):
    role = serializers.CharField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'middle_name', 'last_name', 'membership_id',
            'title', 'mobile_number', 'date_of_birth', 'gender', 'address1',
            'address2', 'address3', 'highest_qualification', 'pincode',
            'father_name', 'mother_name', 'spouse_name', 'from_india', 'country',
            'state', 'city', 'remarks', 'eligibility', 'exposure',
            'electronics_experience', 'area_of_specialization', 'role','membership_fee'
        ]
        
        read_only_fields = ['membership_id']
        
    def get_role_prefix(self, role):
        if not role or not role.name:
            return None

        words = role.name.strip().split()
        prefix = ''.join(word[0] for word in words[:2]).upper()
        return prefix if prefix else None

    
    def validate_role(self, value):
        role_name = value.strip()
        role = Role.objects.filter(name__iexact=role_name).first()
        if not role:
            raise serializers.ValidationError(f"Role '{role_name}' does not exist.")
        
        prefix = self.get_role_prefix(role)
        if not prefix:
            raise serializers.ValidationError(f"Role '{role_name}' is not allowed.")

        self._validated_role = role
        return role


    def create(self, validated_data):
        role = validated_data.get("role") or getattr(self, "_validated_role", None)
        validated_data["role"] = role

        if not validated_data.get("membership_id"):
            prefix = self.get_role_prefix(role)
            if not prefix:
                raise serializers.ValidationError(f"No prefix configured for role: {role.name}")

            last_user = (
                User.objects
                .filter(membership_id__startswith=f"{prefix}-")
                .order_by('-membership_id')
                .first()
            )

            if last_user:
                try:
                    number_part = last_user.membership_id.split('-')[1]
                    last_number = int(number_part)
                except (IndexError, ValueError):
                    last_number = 0
            else:
                last_number = 0

            while True:
                last_number += 1
                new_id = f"{prefix}-{last_number:06d}"
                if not User.objects.filter(membership_id=new_id).exists():
                    validated_data["membership_id"] = new_id
                    break

        return super().create(validated_data)

    
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["role"] = instance.role.name if instance.role else None
        return rep


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"



class UpdatePersonalDetailsSerializer(serializers.ModelSerializer):
    centre_name = serializers.CharField(source="centre.name", read_only=True)
    sub_centre_name = serializers.CharField(source="sub_centre.name", read_only=True)
    # allow user to reference an existing Title by PK
    # title = serializers.PrimaryKeyRelatedField(
    #     queryset=Title.objects.all(),
    #     required=False,
    #     allow_null=True,
    # )
    # # or supply a brand‑new title string
    # custom_title = serializers.CharField(
    #     write_only=True,
    #     required=False,
    #     help_text="If supplied, a new Title(name=…) will be created or retrieved."
    # )

    class Meta:
        model = User
        fields = [
            "title",
            "from_india", "landline_no", "name", "middle_name", "last_name","mobile_verified",
            "father_name", "mother_name", "spouse_name","avatar","designation","centre", "sub_centre","centre_name","sub_centre_name",
            "date_of_birth", "gender","mobile_number","email",
            "country", "state", "city", "pincode",
            "address1", "address2", "address3",
            # … add any other updatable fields here …
        ]
        read_only_fields = [ "mobile_verified"]



    def update(self, instance, validated_data):
            # Reset mobile_verified if mobile_number changes
            new_mobile = validated_data.get("mobile_number")
            if new_mobile and new_mobile != instance.mobile_number:
                validated_data["mobile_verified"] = False
            return super().update(instance, validated_data) 

    def save(self, *args, **kwargs):
        sub_centre = self.validated_data.get("sub_centre") or getattr(self.instance, "sub_centre", None)
        centre = self.validated_data.get("centre") or getattr(self.instance, "centre", None)

        if sub_centre and centre and sub_centre.centre != centre:
            raise serializers.ValidationError("Sub-centre does not belong to the selected centre.")
        
        return super().save(*args, **kwargs)      

    # def update(self, instance, validated_data):
    #     # 1. Handle custom_title → Title
    #     custom = validated_data.pop("custom_title", None)
    #     if custom:
    #         title_obj, _ = Title.objects.get_or_create(name=custom.strip())
    #         instance.title = title_obj
    #     else:
    #         # 2. Or handle existing title PK
    #         title_obj = validated_data.pop("title", None)
    #         if title_obj is not None:
    #             instance.title = title_obj

    #     # 3. Update rest of the fields
    #     for attr, val in validated_data.items():
    #         setattr(instance, attr, val)

    #     instance.save()
    #     return instance

        

class CentreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Centre
        fields = '__all__'

class SubCentreSerializer(serializers.ModelSerializer):
    centre=CentreSerializer(read_only=True)
    class Meta:
        model = SubCentre
        fields = '__all__'

#####################################################################################
class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = '__all__'
        read_only_fields = ('user',)



class ProposersSerializer(serializers.ModelSerializer):   
    class Meta:
        model = Proposer
        fields = '__all__'
        read_only_fields = ('user','token','status','expiry_date')

class QualificationSerializer(serializers.ModelSerializer):
    document = serializers.FileField(required=False, allow_null=True)
    class Meta:
        model = Qualification
        fields = '__all__'
        read_only_fields = ['user']

class QualificationTypeSerialiser(serializers.ModelSerializer):
    class Meta:
        model=QualificationType
        fields="__all__"

class QualificationBranchSerialiser(serializers.ModelSerializer):
    class Meta:
        model=QualificationBranch
        fields="__all__"

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'id', 'user',
            'aadhar_front', 'aadhar_back',
            'passport', 'profile_photo', 'signature'
        ]
        read_only_fields = ['user']



###########################################################################################3

        

class ApproveMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApproveMembership
        fields = '__all__'
        read_only_fields = ['submitted_at']


from rest_framework import serializers
from .models import ConfigSetting
from django.contrib.auth import get_user_model

User = get_user_model()

class ConfigSettingSerializer(serializers.ModelSerializer):
    approval_user_ids = serializers.PrimaryKeyRelatedField(
        source='approval_user', many=True, queryset=User.objects.all(), write_only=True, required=False
    )
    approval_user = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ConfigSetting
        fields = ['id', 'title', 'type', 'approval_prsnt', 'heirarchy', 'value', 'approval_user_ids', 'approval_user']

    def get_approval_user(self, obj):
        return [
            {"id": u.id, "name": u.name, "email": u.email}
            for u in obj.approval_user.all()
        ]


class ConfigSerializer(serializers.ModelSerializer):
    role=RolelistSerializer()
    class Meta:
        model = User
        fields = ['id',"role",'membership_id',"name"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model=Notification
        fields="__all__"
        
    
class ApplicationVerificationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model=ApplicationVerificationStatus
        fields='__all__'