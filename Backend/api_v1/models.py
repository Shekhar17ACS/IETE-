from django.contrib.auth.base_user import BaseUserManager, AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
import random
import uuid
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.db.models import SET_NULL, CASCADE
from .managers import UserManager
from datetime import date

class Common(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True



class Role(Common):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50,null=True,blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True,related_name='user_roles')
    group = models.OneToOneField(Group, on_delete=models.CASCADE,null=True,blank=True)
    
    def __str__(self):
        return f"{self.name} is child of ({self.parent or ""})"



#Centre and Sub-Centre
class Centre(models.Model):
    name = models.CharField(max_length=100, unique=True,null=True,blank=True)
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class SubCentre(models.Model):
    centre = models.ForeignKey(Centre, on_delete=models.CASCADE, related_name="subcentres")
    name = models.CharField(max_length=100,null=True,blank=True)
    address = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('centre', 'name')

    def __str__(self):
        return f"{self.name} ({self.centre.name})"


class User(AbstractBaseUser, PermissionsMixin, Common):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application_id = models.CharField(max_length=15, null=True, blank=True, unique=True, editable=False)
    membership_id = models.CharField(max_length=15, null=True, blank=True, unique=True, editable=True)
    # title = models.ForeignKey("Title", on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=50, null=True, blank=True, help_text="e.g. 'Mr.', 'Ms.', 'Dr.', etc.")
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='roles')
    designation = models.CharField(max_length=200, null=True, blank=True, help_text="User's designation or job title.")
    name = models.CharField(max_length=200, null=True, blank=True)
    middle_name = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=50, null=True, blank=True)
    mobile_number = models.CharField(max_length=20, blank=True)
    mobile_verified = models.BooleanField(default=False, help_text="Indicates if the mobile number is verified.")
    landline_no = models.CharField(max_length=25, null=True, blank=True)
    email = models.EmailField(unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    address1 = models.CharField("Address Line 1", max_length=255, null=True, blank=True)
    address2 = models.CharField("Address Line 2", max_length=255, null=True, blank=True)
    address3 = models.CharField("Address Line 3", max_length=255, null=True, blank=True)
    centre = models.ForeignKey("Centre", on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    sub_centre = models.ForeignKey("SubCentre", on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    highest_qualification = models.CharField(max_length=200, null=True, blank=True)
    pincode = models.CharField(max_length=7, null=True, blank=True)
    father_name = models.CharField(max_length=200, null=True, blank=True)
    mother_name = models.CharField(max_length=200, null=True, blank=True)
    spouse_name = models.CharField(max_length=50, null=True, blank=True)
    from_india = models.BooleanField(default=True)
    country = models.CharField(max_length=50, null=True, blank=True)
    state = models.CharField(max_length=50, null=True, blank=True)
    city = models.CharField(max_length=50, null=True, blank=True)
    total_experience = models.FloatField(null=True,blank=True)
    remarks = models.TextField(null=True, blank=True, help_text="Any additional remarks or notes about the user.")
    is_approved = models.BooleanField(default=False, help_text="Indicates if the user has been approved for membership.")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    eligibility = models.TextField(null=True, blank=True)
    payment_details = models.JSONField(null=True, blank=True)

    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    exposure = models.BooleanField(default=False)
    electronics_experience = models.BooleanField(default=False)
    area_of_specialization = models.TextField(null=True, blank=True)
    membership_fee = models.ForeignKey("MembershipFee", on_delete=models.SET_NULL, null=True, blank=True)

    def update_total_experience(self):
        total_days = 0
        for exp in self.experiences.all():
            if exp.start_date:
                end = exp.end_date or date.today()
                total_days += (end - exp.start_date).days
        self.total_experience = round(total_days / 365, 2)
        self.save(update_fields=["total_experience"])

    username = None
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def generate_application_id(self):
        """Generates a unique application ID."""
        while True:
            app_id = f"APP{random.randint(100000, 999999)}"
            if not User.objects.filter(application_id=app_id).exists():
                return app_id

    def __str__(self):
        return f"{self.email} - {self.name} ({self.application_id})"
    


class Document(Common):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name='document')
    aadhar_front = models.FileField("Aadhar Front", upload_to="documents/aadhar/front/", null=True, blank=True)
    aadhar_back = models.FileField("Aadhar Back", upload_to="documents/aadhar/back/", null=True, blank=True)
    passport = models.FileField("Passport", upload_to="documents/passport/", null=True, blank=True)
    profile_photo = models.FileField("Profile Photo", upload_to="documents/profile_photo/", null=True, blank=True)
    signature = models.FileField("Signature", upload_to="documents/signature/", null=True, blank=True)

class QualificationType(Common):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} type {self.type}"


class QualificationBranch(Common):
    qualification_type = models.ForeignKey(QualificationType, on_delete=models.CASCADE, related_name="branches")
    name = models.CharField(max_length=100,null=True,blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ("qualification_type", "name")

    def __str__(self):
        return f"{self.qualification_type.name} – {self.name}"


class Qualification(Common):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='qualifications')
    qualification_type = models.ForeignKey(QualificationType, on_delete=models.SET_NULL, null=True)
    qualification_branch = models.ForeignKey(QualificationBranch, on_delete=models.SET_NULL, null=True, blank=True)
    institute_name = models.CharField(max_length=255)
    board_university = models.CharField(max_length=255, null=True, blank=True)
    year_of_passing = models.PositiveIntegerField()
    percentage_cgpa = models.CharField(max_length=20)
    document = models.FileField(upload_to='documents/qualifications/', null=True, blank=True, help_text="Upload qualification document (e.g., certificate or mark sheet).")

    def __str__(self):
        return f"{self.qualification_type} - {self.qualification_branch} - {self.institute_name}"


class Payment(Common):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    membership_type = models.CharField(max_length=50, null=True, blank=True)
    order_id = models.CharField(max_length=100)
    payment_id = models.CharField(max_length=255, null=True, blank=True)
    receipt = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default="INR")
    # status = models.CharField(max_length=20, default="Pending")
    status = models.CharField(max_length=20, choices=[("Pending", "Pending"), ("Success", "Success"), ("Failed", "Failed")], default="Pending")

    def __str__(self):
        return f"{self.user} - {self.membership_type} - {self.amount} {self.currency} ({self.status})"





class Experience(Common):
    user = models.ForeignKey(User, on_delete=CASCADE, related_name="experiences")
    organization_name = models.CharField(max_length=255, null=True, blank=True)
    employee_type = models.CharField(max_length=50, null=True, blank=True)
    job_title = models.CharField(max_length=255, null=True, blank=True)
    currently_working = models.BooleanField(default=False, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    work_type = models.CharField(max_length=50, null=True, blank=True)
    total_experience = models.CharField(max_length=30, null=True, blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.user:
            self.user.update_total_experience()

    def delete(self, *args, **kwargs):
        user = self.user
        super().delete(*args, **kwargs)
        if user:
            user.update_total_experience()

    def __str__(self):
        return f"{self.user.email} - {self.job_title} at {self.organization_name}"


def default_expiry_date():
    return timezone.now() + timedelta(days=30)

class Proposer(Common):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE,related_name="proposer")  
    name = models.CharField(max_length=255,null=True,blank=True)
    membership_no = models.CharField(max_length=50)
    mobile_no = models.BigIntegerField()
    email = models.EmailField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending',null=True,blank=True)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=True)
    expiry_date = models.DateTimeField(default=default_expiry_date)
    
    
    def __str__(self):
        return f"{self.user.name} Proposed-By {self.name}"


############################################  CATEGORY  and  MEMBERSHIP  ########################################################
class MembershipFee(models.Model):
    membership_type = models.CharField(max_length=50, help_text="e.g. 'Fellow', 'Member', 'Associate Member', etc.")
    min_age = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(0)], help_text="Inclusive lower‐age bound.  Leave blank for no lower bound.")
    max_age = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(0)], help_text="Inclusive upper‐age bound.  Leave blank for no upper bound.")
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total fee including GST.")
    currency = models.CharField(max_length=5, default="INR", help_text="Currency code, e.g. 'INR' or 'USD'.")
    is_foreign_member = models.BooleanField(default=False, help_text="If True, applies to all ages (ignore min/max).")
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18, help_text="GST percent included in fee_amount.")
    experience = models.FloatField(null=True, blank=True, help_text="Experience in years. Leave blank if not applicable.")
    class Meta:
        unique_together = (
            # ensure we don’t duplicate the same slice
            'membership_type', 'min_age', 'max_age', 'is_foreign_member'
        )

    def __str__(self):
        rng = (
            "any age" if self.is_foreign_member
            else f"{self.min_age or 0}–{self.max_age or '∞'} yrs"
        )
        return f"{self.membership_type} ({rng}) → {self.fee_amount} {self.currency}"


class TransferFee(models.Model):
    transfer_from = models.ForeignKey(MembershipFee, related_name='transfers_from',on_delete=models.CASCADE)
    transfer_to = models.ForeignKey(MembershipFee, related_name='transfers_to',on_delete=models.CASCADE)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2,help_text="Transfer subscription fee (incl. GST).")
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18,help_text="GST percent included in fee_amount.")

    def __str__(self):
        return (f"Transfer {self.transfer_from.membership_type} → "f"{self.transfer_to.membership_type}: {self.fee_amount}")



class CharteredEngineerFee(models.Model):
    fee_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=15000,
        help_text="Total fee including GST."
    )
    gst_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=18,
        help_text="GST percent included in fee_amount."
    )

    def __str__(self):
        return f"Chartered Engineer Fee: {self.fee_amount}"


class ISFMembership(models.Model):
    membership_type = models.CharField(
        max_length=50,
        help_text="e.g. 'ISF Membership'"
    )
    year = models.PositiveIntegerField()
    fee_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Fee for that year (incl. GST)."
    )
    currency = models.CharField(
        max_length=5, default="INR",
        help_text="Currency code."
    )
    gst_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=18,
        help_text="GST percent included in fee_amount."
    )

    class Meta:
        unique_together = ('membership_type', 'year')

    def __str__(self):
        return f"{self.membership_type} {self.year}: {self.fee_amount} {self.currency}"
    

class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    )

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    changes = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def _str_(self):
        return f"{self.timestamp} | {self.user} | {self.action} | {self.model_name} [{self.object_id}]"
    
    @property
    def user_name(self):
        return getattr(self.user, 'name', None) if self.user else None

    @property
    def user_email(self):
        return getattr(self.user, 'email', None) if self.user else None
    

class ApproveMembership(Common):
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='membership_application')
    approved_by = models.ManyToManyField(User, related_name='approved_memberships')
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)
    rejected = models.BooleanField(default=False)
    remark = models.TextField(blank=True, null=True)
    
    
    
    def __str__(self):
        approvers = ", ".join([user.name for user in self.approved_by.all()])
        return f"Application #{self.applicant_id} | Applicant: {self.applicant.name} | Approved by: {approvers}"



class ConfigSetting(Common):
    title = models.CharField(max_length=100, null=True)
    type = models.CharField(max_length=100, null=True)
    approval_user = models.ManyToManyField(User)
    approval_prsnt = models.DecimalField(max_digits=10, decimal_places=2)
    heirarchy = models.BooleanField(default=False)
    value = models.JSONField(default=dict,null=True, blank=True)

    def __str__(self):
        return self.title or 'App Config'
    

class Notification(Common):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name="sent_notifications", on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    delivered = models.BooleanField(default=False) 
    delivered_at = models.DateTimeField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    

    

class ApplicationVerificationStatus(Common):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    personal_details = models.BooleanField(default=False)
    qualification = models.BooleanField(default=False)
    experience = models.BooleanField(default=False)
    proposer = models.BooleanField(default=False)
    membership = models.BooleanField(default=False)
    documents = models.BooleanField(default=False)  
    payment = models.BooleanField(default=False)
    eligibility = models.BooleanField(default=False)







