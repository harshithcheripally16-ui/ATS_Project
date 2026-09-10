import re
from flask import Blueprint, request
from ..models import db, User, CandidateProfile
from ..services import EmailService
from ..utils import (
    success_response,
    error_response,
    generate_auth_token,
    token_required
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

def validate_password_strength(password: str):
    """Enforce strong password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 digit."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter (A-Z)"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter (a-z)"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number (0-9)"
    return True, None

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role = (data.get('role') or '').strip().lower()
    phone = (data.get('phone') or '').strip() or None

    if not name or not email or not password or not role:
        return error_response("Missing required fields: name, email, password, and role are required", 400)

    if not re.match(EMAIL_REGEX, email):
        return error_response("Invalid email address format", 400)

    is_strong, err_msg = validate_password_strength(password)
    if not is_strong and len(password) < 6:
        return error_response(err_msg, 400)

    if role not in ('candidate', 'recruiter'):
        return error_response("Role must be either 'candidate' or 'recruiter'", 400)

    if User.query.filter_by(email=email).first():
        return error_response("An account with this email address already exists", 400)

    try:
        user = User(
            name=name,
            email=email,
            role=role,
            phone=phone,
            is_active=False
        )
        user.set_password(password)
        otp_code = user.generate_otp(purpose='first_login_verify', expires_minutes=10)
        db.session.add(user)
        db.session.flush()

        if role == 'candidate':
            profile = CandidateProfile(user_id=user.id)
            db.session.add(profile)

        db.session.commit()

        EmailService.send_otp_verification_email(user.id, user.name, user.email, otp_code)

        return success_response(
            data={
                'user': user.to_dict(),
                'requires_otp': True,
                'email': user.email
            },
            message="Registration successful! A 6-digit verification code has been sent to your email.",
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f"Registration failed: {str(e)}", 500)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return error_response("Email and password are required", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return error_response("Invalid email or password", 401)

    # First login verification check for unverified new users across all modules
    if not user.is_active:
        otp_code = user.generate_otp(purpose='first_login_verify', expires_minutes=10)
        db.session.commit()
        EmailService.send_otp_verification_email(user.id, user.name, user.email, otp_code)

        return success_response(
            data={
                'requires_otp': True,
                'email': user.email,
                'purpose': 'first_login_verify'
            },
            message="Account verification required. A 6-digit OTP code has been sent to your email."
        )

    token = generate_auth_token(user)
    user_dict = user.to_dict()
    if user.candidate_profile:
        user_dict['candidate_profile_id'] = user.candidate_profile.id

    return success_response(
        data={
            'token': token,
            'user': user_dict
        },
        message="Login successful"
    )


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify 6-digit OTP code for first-login verification or password reset."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    otp = (data.get('otp') or '').strip()
    purpose = data.get('purpose', 'first_login_verify')

    if not email or not otp:
        return error_response("Email and 6-digit OTP are required", 400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return error_response("User account not found", 404)

    if not user.verify_otp(otp, purpose=purpose):
        return error_response("Invalid or expired OTP verification code", 400)

    if purpose == 'first_login_verify':
        user.is_active = True
        user.clear_otp()
        db.session.commit()

        token = generate_auth_token(user)
        user_dict = user.to_dict()
        if user.candidate_profile:
            user_dict['candidate_profile_id'] = user.candidate_profile.id

        return success_response(
            data={
                'token': token,
                'user': user_dict
            },
            message="Account successfully verified! You are now logged in."
        )
    elif purpose == 'password_reset':
        reset_token = EmailService.generate_reset_token(user.id, user.email)
        return success_response(
            data={'reset_token': reset_token},
            message="OTP verified successfully. You may now set a new password."
        )
    
    return error_response("Invalid OTP purpose", 400)


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend a fresh 6-digit OTP to the user's email."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    purpose = data.get('purpose', 'first_login_verify')

    if not email:
        return error_response("Email is required", 400)

    user = User.query.filter_by(email=email).first()
    if user:
        if purpose == 'password_reset':
            otp_code = user.generate_otp(purpose='password_reset', expires_minutes=15)
            db.session.commit()
            EmailService.send_password_reset_otp_email(user.id, user.name, user.email, otp_code)
        else:
            otp_code = user.generate_otp(purpose='first_login_verify', expires_minutes=10)
            db.session.commit()
            EmailService.send_otp_verification_email(user.id, user.name, user.email, otp_code)

    return success_response(message="A new 6-digit verification code has been dispatched to your email.")


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json() or {}
    token = data.get('token')
    if not token:
        return error_response("Verification token is required", 400)

    payload = EmailService.verify_token(token, expected_type='verify_email')
    if not payload:
        return error_response("Invalid or expired verification token", 400)

    user_id = payload.get('user_id')
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User account not found", 404)

    if user.is_active:
        return success_response(message="Account is already verified. You can log in.")

    user.is_active = True
    user.clear_otp()
    db.session.commit()

    return success_response(
        data={'user': user.to_dict()},
        message="Email successfully verified! Your account is now active. You may log in."
    )


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return error_response("Email is required", 400)

    user = User.query.filter_by(email=email).first()
    if user:
        otp_code = user.generate_otp(purpose='password_reset', expires_minutes=15)
        db.session.commit()
        EmailService.send_password_reset_otp_email(user.id, user.name, user.email, otp_code)

    return success_response(
        data={'email': email},
        message="If an account with that email exists, a password reset code has been sent."
    )


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    otp = (data.get('otp') or '').strip()
    token = data.get('token')
    new_password = data.get('password') or ''

    if not new_password:
        return error_response("New password is required", 400)

    is_strong, err_msg = validate_password_strength(new_password)
    if not is_strong:
        return error_response(err_msg, 400)

    user = None
    if otp and email:
        user = User.query.filter_by(email=email).first()
        if not user or not user.verify_otp(otp, purpose='password_reset'):
            return error_response("Invalid or expired password reset OTP code", 400)
    elif token:
        payload = EmailService.verify_token(token, expected_type='reset_password')
        if not payload:
            return error_response("Invalid or expired password reset token", 400)
        user_id = payload.get('user_id')
        user = db.session.get(User, user_id)
        if not user:
            return error_response("User account not found", 404)
    else:
        return error_response("Password reset code or token is required", 400)

    user.set_password(new_password)
    user.clear_otp()
    user.is_active = True
    db.session.commit()

    return success_response(message="Password has been reset successfully. You can now log in.")


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user_profile(current_user: User):
    user_dict = current_user.to_dict()
    if current_user.candidate_profile:
        user_dict['candidate_profile'] = current_user.candidate_profile.to_dict(include_user=False)
    return success_response(data={'user': user_dict})
