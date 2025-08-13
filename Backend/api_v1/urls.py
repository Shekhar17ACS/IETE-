from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.http import JsonResponse
from .views import *

def test_view(request):
    return JsonResponse({"message": "It works"})


urlpatterns = [
    path('test/', test_view),
    path('signup/', SignupAPIView.as_view()),
    path('login/', RoleLoginAPIView.as_view()),
    path("stats/", DashboardStatsAPIView.as_view(), name="dashboard-stats"),
    path('forgot-password/', RequestPasswordResetAPIView.as_view()),
    path('reset-password/', ResetPasswordAPIView.as_view()),
    path('verify-otp/', VerifyOTPAPIView.as_view()),
    path('resend-otp/', ResendOTPAPIView.as_view()),
    path('update-personal-details/', UpdatePersonalDetailsAPIView.as_view(), name='update-personal-details'),

    path('centre/', AddCentre.as_view(), name='centre'),
    path('sub-centre/', AddSubCentre.as_view(), name='centre'),


    path("qualification-type/", QualificationTypeAPI.as_view(),name="qualification-type"),
    path("qualification-branch/", QualificationBranchAPI.as_view(),name="qualification-branch"),
    
    
    # mobile no verify
    path("otp-send/", SendOTPAPIView.as_view(), name="send-otp"),
    path("otp-verify/", VerifyOTPAPIView.as_view(), name="verify-otp"),
    
    path("create-order/", CreateOrderAPIView.as_view(), name="create-order"),
    path("verify-payment/", VerifyPaymentAPIView.as_view(), name="verify-payment"),
    path("payment-refund/", RefundMembershipPaymentAPIView.as_view(), name="payment-refund"),
    
    path("experience/", ExperienceAPIView.as_view(), name="experience"),
    # path("proposers/", ProposersAPIView.as_view(), name="proposers"),
    path("qualification/", QualificationAPIView.as_view(), name="qualification"),
    path("eligibility/", EligibilityAPIView.as_view(), name="eligibility"),
    path('documents/', DocumentAPIView.as_view(), name='documents'),
     path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('payment-history/', PaymentListAPIView.as_view(), name='payment-list'),
    path('application-preview/', ApplicationPreviewAPIView.as_view(), name='application-preview'),
    path("payment-status/", PaymentStatusAPIView.as_view(), name="payment-status"),




    path('membership-fee/', MembershipFeeListCreateAPIView.as_view(), name='membership-fee-list-create'),
    path('membership-fee/<int:pk>/', MembershipFeeDetailAPIView.as_view(), name='membership-fee-detail'),
    path('save-membership/', SaveMembershipFeeAPIView.as_view(), name='save-membership'),

    path('add-member/', AddMember.as_view(), name='user-api'),
    
    path("permissions-matrix/", PermissionMatrixView.as_view(), name="permission-matrix"),
    

    path('config-settings/', ConfigSettingAPIView.as_view(),name="config-setting"),

    path("applications/", ApplicationListAPIView.as_view(), name="application-list"),

    path('membership/approve/', ApproveMembershipAPIView.as_view(),name='approve-member'),
    
    path('membership/status/', ApprovalStatus.as_view(),name='approve-status'),
    
    path('members/reports/', MemberReportView.as_view(), name='export-members'),
    


    path("user/id-certificate/", UserIDCardAndCertificateAPIView.as_view(), name="id-card"),
    

    
    
    #new updated proposer api url
    path('proposers/', ProposersAPIView.as_view(), name='proposers'),
    path('proposer/action/', ProposerActionAPIView.as_view(), name='proposer-action'),
    path('application-tracker/', ApplicationTrackerAPIView.as_view(), name='application-tracker'),
    

    
    #New API's

    path('users/', GetAllUsers.as_view(),name="users"),
    path('all-roles/', RoleListAPIView.as_view(),name="roles"),
    path("roles/<uuid:role_id>/", RoleAPIView.as_view(), name="role"),
    path('roles/', RoleAPIView.as_view()),
    path('logs/', AdminLogListAPIView.as_view(), name='admin-logs'),
    
    path('payments/pending-verify/', PendingPaymentsAPIView.as_view(), name='payment-reciept'),
    path('payment-receipt/', PaymentReceiptsAPIView.as_view(), name='payment-reciept'),
]


