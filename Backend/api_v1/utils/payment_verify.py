
from django.core.mail import send_mail
from django.conf import settings


def send_payment_success_email(user, payment):
    subject = "Acknowledgement of Payment Receipt - IETE"

    message = f"""
Dear {user.name},

We are pleased to inform you that your payment associated with Receipt No: {payment.id} has been successfully received and verified by the Institution of Electronics and Telecommunication Engineers (IETE).

Below are the payment details for your reference:

------------------------------------------------------------
Receipt Number: {payment.id}
Order ID: {payment.order_id or 'N/A'}
Amount Paid: ₹{payment.amount}
Date & Time of Payment: {payment.created_at.strftime('%d-%m-%Y %I:%M %p')}
------------------------------------------------------------

Your transaction has been processed successfully, and no further action is required at this time.

Please retain this email for your records. If you have any queries regarding this payment, feel free to contact us at support@iete.org or visit your nearest IETE Centre.

Thank you for your association with IETE.

Warm regards,  
Secretary General  
The Institution of Electronics and Telecommunication Engineers (IETE)  
Website: https://www.iete.org  
"""

    # user.email_user(subject, message.strip())
    send_mail(
        subject,
        message.strip(),
        settings.DEFAULT_FROM_EMAIL,         # From email (must be set in settings or passed explicitly)
        [user.email],               # Recipient list
        fail_silently=False,
    )


def send_payment_failure_email(user, payment):
    subject = "Payment Verification Failed - IETE"

    message = f"""
Dear {user.name},

We regret to inform you that your recent payment attempt with Receipt No: {payment.id} could not be verified by the Institution of Electronics and Telecommunication Engineers (IETE).

It appears that the transaction was not completed successfully, or the payment confirmation was not received from the payment gateway.

------------------------------------------------------------
Receipt Number: {payment.id}
Order ID: {payment.order_id or 'N/A'}
Attempted Amount: ₹{payment.amount}
Date & Time of Payment: {payment.created_at.strftime('%d-%m-%Y %I:%M %p')}
------------------------------------------------------------

Please ensure that the payment was deducted from your account. If it was, kindly wait 24-48 hours for reconciliation, or share the transaction reference/UTR number with us at support@iete.org for manual verification.

We apologize for the inconvenience caused and appreciate your patience.

Warm regards,  
Accounts Department  
The Institution of Electronics and Telecommunication Engineers (IETE)  
Website: https://www.iete.org  
"""

    # user.email_user(subject, message.strip())
    send_mail(
        subject,
        message.strip(),
        settings.DEFAULT_FROM_EMAIL,        
        [user.email],               
        fail_silently=False,
    )




# Approval Email-
def membership_finalized_email(applicant_name, membership_id, role_name):
    subject = "✅ Final Approval Notice - Membership Complete"
    message = f"""
Dear {applicant_name},

We are pleased to inform you that your membership application has been **approved**.

The details of your membership are as follows:

------------------------------------------------
Membership ID   : {membership_id}  
Membership Role : {role_name}
------------------------------------------------

Please retain this email for future reference.

Sincerely,  
Department of Membership Affairs  
Institution of Electronics and Telecommunication Engineers (IETE)

[This is a system-generated email. Please do not reply directly.]
"""
    return subject, message.strip()

def approver_notification_email(approver_name, applicant_name, membership_id):
    subject = "Membership Finalized Notification"
    message = f"""
Dear {approver_name},

This is to inform you that the membership application for **{applicant_name}** has been successfully finalized.

The assigned Membership ID is: **{membership_id}**

We thank you for your participation in the approval process.

Sincerely,  
Department of Membership Affairs  
Institution of Electronics and Telecommunication Engineers (IETE)

[This is a system-generated email. Please do not reply directly.]
"""
    return subject, message.strip()


def applicant_interim_status_email(applicant_name, approver_name, approved=True):
    status = "approved" if approved else "rejected"
    subject = f"Membership {status.capitalize()} Notification"
    message = f"""
Dear {applicant_name},

Your membership application has been *{status}* by {approver_name}.

It is currently under review by other approvers. You will be notified once the process is complete.

Sincerely,  
Department of Membership Affairs  
Institution of Electronics and Telecommunication Engineers (IETE)

[This is a system-generated email. Please do not reply directly.]
"""
    return subject, message.strip()


def notify_pending_approver(approver_name, applicant_name):
    subject = "Action Required: Membership Approval Pending"
    message = f"""
Dear {approver_name},

You are requested to review and act upon the membership application of *{applicant_name}*.

Your prompt response is appreciated.

Sincerely,  
Department of Membership Affairs  
Institution of Electronics and Telecommunication Engineers (IETE)

[This is a system-generated email. Please do not reply directly.]
"""
    return subject, message.strip()
