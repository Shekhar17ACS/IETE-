from django.core.mail import send_mail
from django.conf import settings


def send_proposer_invitation(proposer, applicant_name):
    approve_url = f"{settings.SITE_URL}/proposer/action/?token={proposer.token}&action=approve"
    reject_url  = f"{settings.SITE_URL}/proposer/action/?token={proposer.token}&action=reject"


    subject = f"Membership Proposer Request for {applicant_name}"
    html_message = f"""
    <p>Dear {proposer.name},</p>
    <p>{applicant_name} has selected you as a proposer for their membership.</p>
    <p>Please take action below within 30 days:</p>
    <a href="{approve_url}" style="padding:10px 20px;background:green;color:white;text-decoration:none;cursor:pointer;border-radius:10px">Approve</a>
    &nbsp;
    <a href="{reject_url}" style="padding:10px 20px;background:red;color:white;text-decoration:none;cursor:pointer;border-radius:10px">Reject</a>
    <p>If no action is taken, this request will automatically expire.</p>
    """

    send_mail(
        subject,
        '',
        settings.DEFAULT_FROM_EMAIL,
        [proposer.email],
        html_message=html_message
    )
