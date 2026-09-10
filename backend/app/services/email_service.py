import smtplib
import threading
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
import jwt
from flask import current_app

logger = logging.getLogger('EmailService')

class EmailService:
    @staticmethod
    def generate_token(payload_data: dict, expires_in_seconds: int) -> str:
        secret = current_app.config['JWT_SECRET_KEY']
        now = datetime.now(timezone.utc)
        payload = {
            **payload_data,
            'iat': now,
            'exp': now + timedelta(seconds=expires_in_seconds)
        }
        return jwt.encode(payload, secret, algorithm='HS256')

    @staticmethod
    def verify_token(token: str, expected_type: str = None) -> dict:
        secret = current_app.config['JWT_SECRET_KEY']
        try:
            payload = jwt.decode(token, secret, algorithms=['HS256'])
            if expected_type and payload.get('type') != expected_type:
                return None
            return payload
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
            logger.warning(f"Token validation failed: {str(e)}")
            return None

    @classmethod
    def generate_verification_token(cls, user_id: int, email: str) -> str:
        ttl = current_app.config.get('VERIFY_TOKEN_EXPIRES_HOURS', 24) * 3600
        return cls.generate_token({'user_id': user_id, 'email': email, 'type': 'verify_email'}, ttl)

    @classmethod
    def generate_reset_token(cls, user_id: int, email: str) -> str:
        ttl = current_app.config.get('RESET_TOKEN_EXPIRES_MINUTES', 60) * 60
        return cls.generate_token({'user_id': user_id, 'email': email, 'type': 'reset_password'}, ttl)

    @classmethod
    def _send_email_async(cls, app, recipient: str, subject: str, html_body: str, text_body: str = None):
        def send():
            with app.app_context():
                smtp_host = app.config.get('SMTP_HOST')
                smtp_port = app.config.get('SMTP_PORT', 587)
                smtp_user = app.config.get('SMTP_USER')
                smtp_password = app.config.get('SMTP_PASSWORD')
                smtp_from = app.config.get('SMTP_FROM', 'no-reply@ats-portal.com')
                smtp_use_tls = app.config.get('SMTP_USE_TLS', True)

                # Dev fallback: print without emojis for cross-platform cmd/powershell safety
                if not smtp_host or not smtp_user:
                    print("\n" + "=" * 65)
                    print(f"[DEV EMAIL INTERCEPTED]")
                    print(f"To: {recipient}")
                    print(f"Subject: {subject}")
                    print(f"Body Preview:\n{text_body or html_body}")
                    print("=" * 65 + "\n")
                    return

                try:
                    msg = MIMEMultipart('alternative')
                    msg['Subject'] = subject
                    msg['From'] = smtp_from
                    msg['To'] = recipient

                    if text_body:
                        msg.attach(MIMEText(text_body, 'plain'))
                    if html_body:
                        msg.attach(MIMEText(html_body, 'html'))

                    server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                    if smtp_use_tls:
                        server.starttls()
                    if smtp_user and smtp_password:
                        server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_from, recipient, msg.as_string())
                    server.quit()
                    logger.info(f"Email successfully sent to {recipient}")
                except Exception as e:
                    logger.error(f"Failed to send email to {recipient}: {str(e)}")

        thread = threading.Thread(target=send)
        thread.daemon = True
        thread.start()

    @classmethod
    def send_otp_verification_email(cls, user_id: int, name: str, email: str, otp_code: str, token: str = None):
        """Send 6-digit OTP email for user verification at first login."""
        if not token:
            token = cls.generate_verification_token(user_id, email)
        
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://127.0.0.1:5000')
        verify_url = f"{frontend_url}/pages/verify-email.html?token={token}"

        subject = f"{otp_code} is your ATS Portal Verification Code"
        text_body = (
            f"Hello {name},\n\n"
            f"Your one-time verification code (OTP) for Recruitment ATS Portal is:\n\n"
            f"   {otp_code}\n\n"
            f"This code is valid for 10 minutes. Please enter this code on the login/verification screen to verify your account.\n\n"
            f"Alternatively, you can verify via this link: {verify_url}\n\n"
            f"If you did not request this code, please ignore this email.\n\n"
            f"Best regards,\nRecruitment ATS Team"
        )
        html_body = f"""
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background-color: #0b0f19; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 12px; color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #00f0ff; font-size: 22px; margin: 0; letter-spacing: 0.05em; font-family: monospace;">RECRUITMENT ATS</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Account Verification & Security</p>
            </div>
            
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 24px; text-align: center;">
                <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>{name}</strong>,</p>
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px 0;">Use the following One-Time Password (OTP) to complete verification for your account:</p>
                
                <div style="background: linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%); border: 2px dashed #00f0ff; border-radius: 8px; padding: 16px; margin: 20px 0; display: inline-block; min-width: 240px;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #70f8ff; display: block;">{otp_code}</span>
                </div>
                
                <p style="color: #fbbf24; font-size: 13px; margin: 12px 0 0 0; font-weight: 500;">⏱ Valid for 10 minutes</p>
            </div>

            <div style="margin-top: 24px; text-align: center;">
                <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Or click the button below to verify automatically:</p>
                <a href="{verify_url}" style="background: linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%); color: #07090e; padding: 10px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Verify Account Directly</a>
            </div>

            <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 24px 0 16px 0;">
            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">If you did not request this verification code, no action is required.</p>
        </div>
        """
        app = current_app._get_current_object()
        cls._send_email_async(app, email, subject, html_body, text_body)

    @classmethod
    def send_verification_email(cls, user_id: int, name: str, email: str, token: str = None):
        """Send verification email (also generates and includes OTP if user object has one)."""
        if not token:
            token = cls.generate_verification_token(user_id, email)
        
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://127.0.0.1:5000')
        verify_url = f"{frontend_url}/pages/verify-email.html?token={token}"

        subject = "Verify Your Account - Recruitment ATS Portal"
        text_body = f"Hello {name},\n\nPlease verify your email for Recruitment ATS by visiting:\n{verify_url}\n\nThis token will expire in 24 hours."
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1976d2;">Welcome to ATS Portal, {name}!</h2>
            <p>Thank you for registering. Please confirm your email address to activate your account and start using the platform.</p>
            <div style="margin: 24px 0;">
                <a href="{verify_url}" style="background-color: #1976d2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="color: #666; font-size: 13px;">Or copy and paste this link into your browser:<br><a href="{verify_url}">{verify_url}</a></p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link is valid for 24 hours. If you did not create this account, please ignore this email.</p>
        </div>
        """
        app = current_app._get_current_object()
        cls._send_email_async(app, email, subject, html_body, text_body)

    @classmethod
    def send_password_reset_otp_email(cls, user_id: int, name: str, email: str, otp_code: str, token: str = None):
        """Send 6-digit OTP email for password reset."""
        if not token:
            token = cls.generate_reset_token(user_id, email)
        
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://127.0.0.1:5000')
        reset_url = f"{frontend_url}/pages/reset-password.html?token={token}&email={email}"

        subject = f"{otp_code} is your Password Reset Code - Recruitment ATS"
        text_body = (
            f"Hello {name},\n\n"
            f"We received a request to reset the password for your Recruitment ATS account.\n\n"
            f"Your Password Reset OTP is:\n\n"
            f"   {otp_code}\n\n"
            f"This code is valid for 15 minutes. Enter it on the password reset page:\n{reset_url}\n\n"
            f"If you did not request a password reset, please secure your account.\n\n"
            f"Best regards,\nRecruitment ATS Team"
        )
        html_body = f"""
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background-color: #0b0f19; border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f87171; font-size: 22px; margin: 0; letter-spacing: 0.05em; font-family: monospace;">PASSWORD RESET REQUEST</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Recruitment ATS Portal Security</p>
            </div>
            
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 24px; text-align: center;">
                <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>{name}</strong>,</p>
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px 0;">Enter this 6-digit code on the reset password screen:</p>
                
                <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%); border: 2px dashed #f87171; border-radius: 8px; padding: 16px; margin: 20px 0; display: inline-block; min-width: 240px;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #fca5a5; display: block;">{otp_code}</span>
                </div>
                
                <p style="color: #fbbf24; font-size: 13px; margin: 12px 0 0 0; font-weight: 500;">⏱ Valid for 15 minutes</p>
            </div>

            <div style="margin-top: 24px; text-align: center;">
                <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Or set your new password directly using this link:</p>
                <a href="{reset_url}" style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Reset Password Now</a>
            </div>

            <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 24px 0 16px 0;">
            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">If you did not make this request, you can safely ignore this email.</p>
        </div>
        """
        app = current_app._get_current_object()
        cls._send_email_async(app, email, subject, html_body, text_body)

    @classmethod
    def send_password_reset_email(cls, user_id: int, name: str, email: str, token: str = None):
        if not token:
            token = cls.generate_reset_token(user_id, email)
        
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://127.0.0.1:5000')
        reset_url = f"{frontend_url}/pages/reset-password.html?token={token}"

        subject = "Reset Your Password - Recruitment ATS Portal"
        text_body = f"Hello {name},\n\nYou requested a password reset. Click the link below to set a new password:\n{reset_url}\n\nThis token expires in 60 minutes."
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #d32f2f;">Password Reset Request</h2>
            <p>Hello {name},</p>
            <p>We received a request to reset your password for your ATS account. Click the button below to choose a new password.</p>
            <div style="margin: 24px 0;">
                <a href="{reset_url}" style="background-color: #d32f2f; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 13px;">Or copy and paste this link into your browser:<br><a href="{reset_url}">{reset_url}</a></p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link is valid for 60 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        """
        app = current_app._get_current_object()
        cls._send_email_async(app, email, subject, html_body, text_body)

    @classmethod
    def send_status_update_email(cls, candidate_name: str, candidate_email: str, job_title: str, new_status: str, remarks: str = None):
        subject_status = new_status.replace('_', ' ').title()
        subject = f"Application Status Update: {job_title} - {subject_status}"

        remarks_html = f"<p><strong>Remarks from Recruiter:</strong> {remarks}</p>" if remarks else ""
        remarks_text = f"\nRemarks from Recruiter: {remarks}" if remarks else ""

        text_body = (
            f"Hello {candidate_name},\n\n"
            f"Your application status for position '{job_title}' has been updated to: {subject_status}.\n"
            f"{remarks_text}\n\n"
            f"You can log in to your ATS portal to view details.\n\n"
            f"Best regards,\nRecruitment Team"
        )

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1976d2;">Application Status Update</h2>
            <p>Hello <strong>{candidate_name}</strong>,</p>
            <p>Your application status for the position <strong>{job_title}</strong> has been updated to:</p>
            <div style="background-color: #f5f5f5; padding: 12px 18px; border-left: 4px solid #1976d2; margin: 16px 0; font-size: 16px; font-weight: bold; color: #333;">
                {subject_status}
            </div>
            {remarks_html}
            <p>Log in to the candidate portal to track your applications.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated notification from Recruitment ATS Portal.</p>
        </div>
        """
        app = current_app._get_current_object()
        cls._send_email_async(app, candidate_email, subject, html_body, text_body)

    @classmethod
    def send_interview_scheduled_email(cls, candidate_name: str, candidate_email: str, job_title: str, date: str, time: str, mode: str = "online", notes: str = None, is_rescheduled: bool = False, is_cancelled: bool = False):
        if is_cancelled:
            action_title = "Interview Cancelled"
            subject = f"Interview Cancelled: {job_title}"
            accent_color = "#d32f2f"
            status_desc = f"Your interview for position <strong>{job_title}</strong> has been cancelled."
        elif is_rescheduled:
            action_title = "Interview Rescheduled"
            subject = f"Interview Rescheduled: {job_title}"
            accent_color = "#ed6c02"
            status_desc = f"Your interview for position <strong>{job_title}</strong> has been rescheduled to the updated time below."
        else:
            action_title = "Interview Scheduled"
            subject = f"Interview Scheduled: {job_title}"
            accent_color = "#2e7d32"
            status_desc = f"An interview has been scheduled for your application for <strong>{job_title}</strong>."

        notes_html = f"<p><strong>Additional Notes:</strong> {notes}</p>" if notes else ""
        notes_text = f"\nNotes: {notes}" if notes else ""

        text_body = (
            f"Hello {candidate_name},\n\n"
            f"{action_title} for position: '{job_title}'\n"
            f"Date: {date}\n"
            f"Time: {time}\n"
            f"Mode: {mode.title()}\n"
            f"{notes_text}\n\n"
            f"Please log in to your ATS portal for details.\n\n"
            f"Best regards,\nRecruitment Team"
        )

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: {accent_color};">{action_title}</h2>
            <p>Hello <strong>{candidate_name}</strong>,</p>
            <p>{status_desc}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px 0; color: #666; width: 80px;">Date:</td><td style="padding: 8px 0; font-weight: bold;">{date}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Time:</td><td style="padding: 8px 0; font-weight: bold;">{time}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Mode:</td><td style="padding: 8px 0; font-weight: bold;">{mode.title()}</td></tr>
            </table>
            {notes_html}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated notification from Recruitment ATS Portal.</p>
        </div>
        """
        app = current_app._get_current_object()
        cls._send_email_async(app, candidate_email, subject, html_body, text_body)

    @classmethod
    def send_offer_letter_email(cls, candidate_name: str, candidate_email: str, job_title: str, position_title: str, salary: str, joining_date: str, location: str = None):
        """Send formal job offer notification to candidate."""
        subject = f"Official Job Offer: {position_title} at Recruitment ATS"

        text_body = (
            f"Dear {candidate_name},\n\n"
            f"Congratulations! We are delighted to extend a formal job offer for the position of '{position_title}'.\n\n"
            f"Offer Details:\n"
            f"- Position: {position_title}\n"
            f"- Compensation: {salary}\n"
            f"- Proposed Start Date: {joining_date}\n"
            f"- Location: {location or 'As discussed'}\n\n"
            f"Please log in to your ATS Candidate Dashboard to review the complete offer letter and submit your response:\n"
            f"http://127.0.0.1:5000/pages/candidate/dashboard.html\n\n"
            f"We are excited about the prospect of having you on our team!\n\n"
            f"Warm regards,\n"
            f"Recruitment Team"
        )

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #0284c7; margin-bottom: 4px;">Formal Job Offer</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 0;">Recruitment ATS Talent Acquisition</p>
            </div>
            <p>Dear <strong>{candidate_name}</strong>,</p>
            <p>We are thrilled to offer you the position of <strong>{position_title}</strong>!</p>
            <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 6px 0;"><strong>Position:</strong> {position_title}</p>
                <p style="margin: 6px 0;"><strong>Compensation:</strong> {salary}</p>
                <p style="margin: 6px 0;"><strong>Proposed Start Date:</strong> {joining_date}</p>
                <p style="margin: 6px 0;"><strong>Work Location:</strong> {location or 'As discussed'}</p>
            </div>
            <p>Your full offer letter with comprehensive terms, benefits, and reporting details is now available for review.</p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="http://127.0.0.1:5000/pages/candidate/dashboard.html" style="background: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review & Respond to Offer</a>
            </div>
            <p>Please log in to review and acknowledge your offer letter.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an official automated notification from Recruitment ATS Portal.</p>
        </div>
        """
        app = current_app._get_current_object()
        cls._send_email_async(app, candidate_email, subject, html_body, text_body)

    @classmethod
    def send_offer_response_email(cls, recruiter_name: str, recruiter_email: str, candidate_name: str, position_title: str, response_status: str, candidate_notes: str = None):
        """Notify recruiter of candidate offer acceptance or decline."""
        is_accepted = (response_status == 'accepted')
        status_label = "Accepted" if is_accepted else "Declined"
        accent_color = "#10b981" if is_accepted else "#ef4444"

        subject = f"Candidate Offer {status_label}: {candidate_name} for {position_title}"
        notes_text = f"\nCandidate Notes: {candidate_notes}" if candidate_notes else ""
        notes_html = f"<p><strong>Candidate Notes:</strong> {candidate_notes}</p>" if candidate_notes else ""

        text_body = (
            f"Hello {recruiter_name},\n\n"
            f"Candidate {candidate_name} has {status_label.lower()} the job offer for '{position_title}'.\n"
            f"{notes_text}\n\n"
            f"You can review the updated applicant record in the Recruiter Pipeline:\n"
            f"http://127.0.0.1:5000/pages/recruiter/applicants.html\n\n"
            f"Best regards,\n"
            f"Recruitment ATS System"
        )

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: {accent_color};">Job Offer {status_label}</h2>
            <p>Hello <strong>{recruiter_name}</strong>,</p>
            <p>Candidate <strong>{candidate_name}</strong> has officially <strong>{status_label.lower()}</strong> the job offer for <strong>{position_title}</strong>.</p>
            {notes_html}
            <div style="text-align: center; margin: 24px 0;">
                <a href="http://127.0.0.1:5000/pages/recruiter/applicants.html" style="background: #1e293b; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Recruiter Pipeline</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated notification from Recruitment ATS Portal.</p>
        </div>
        """
        app = current_app._get_current_object()
        cls._send_email_async(app, recruiter_email, subject, html_body, text_body)


