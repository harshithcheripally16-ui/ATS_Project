import json
from app.models import User, CandidateProfile, db
from app.services import EmailService

def test_register_candidate(client):
    res = client.post('/api/v1/auth/register', json={
        'name': 'New Candidate',
        'email': 'newcand@example.com',
        'password': 'Password123!',
        'role': 'candidate',
        'phone': '+1122334455'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert 'verification code' in data['message'].lower() or 'verify' in data['message'].lower()
    assert data['data']['requires_otp'] is True

    # Check user is in DB and inactive with OTP code generated
    user = User.query.filter_by(email='newcand@example.com').first()
    assert user is not None
    assert user.is_active is False
    assert user.role == 'candidate'
    assert user.otp_code is not None
    assert len(user.otp_code) == 6
    # Profile auto-created
    assert user.candidate_profile is not None


def test_register_duplicate_email(client):
    payload = {
        'name': 'Duplicate User',
        'email': 'dup@example.com',
        'password': 'Password123!',
        'role': 'recruiter'
    }
    res1 = client.post('/api/v1/auth/register', json=payload)
    assert res1.status_code == 201

    res2 = client.post('/api/v1/auth/register', json=payload)
    assert res2.status_code == 400
    assert 'already exists' in res2.get_json()['error']


def test_login_unverified_account_triggers_otp(client):
    # Register candidate
    client.post('/api/v1/auth/register', json={
        'name': 'Unverified User',
        'email': 'unverified@example.com',
        'password': 'Password123!',
        'role': 'candidate'
    })

    # Attempt login before verification: triggers OTP dispatch and requires_otp
    res = client.post('/api/v1/auth/login', json={
        'email': 'unverified@example.com',
        'password': 'Password123!'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['data']['requires_otp'] is True
    assert data['data']['email'] == 'unverified@example.com'


def test_verify_otp_flow(client):
    # Register candidate
    client.post('/api/v1/auth/register', json={
        'name': 'OTP User',
        'email': 'otpuser@example.com',
        'password': 'Password123!',
        'role': 'candidate'
    })

    user = User.query.filter_by(email='otpuser@example.com').first()
    assert user.is_active is False
    valid_otp = user.otp_code

    # Invalid OTP fails
    bad_res = client.post('/api/v1/auth/verify-otp', json={
        'email': 'otpuser@example.com',
        'otp': '000000',
        'purpose': 'first_login_verify'
    })
    assert bad_res.status_code == 400

    # Valid OTP succeeds and logs in
    good_res = client.post('/api/v1/auth/verify-otp', json={
        'email': 'otpuser@example.com',
        'otp': valid_otp,
        'purpose': 'first_login_verify'
    })
    assert good_res.status_code == 200
    res_data = good_res.get_json()
    assert res_data['success'] is True
    assert 'token' in res_data['data']

    # User is now active
    user = User.query.filter_by(email='otpuser@example.com').first()
    assert user.is_active is True
    assert user.otp_code is None


def test_resend_otp_flow(client):
    client.post('/api/v1/auth/register', json={
        'name': 'Resend User',
        'email': 'resend@example.com',
        'password': 'Password123!',
        'role': 'recruiter'
    })

    user = User.query.filter_by(email='resend@example.com').first()
    initial_otp = user.otp_code

    res = client.post('/api/v1/auth/resend-otp', json={
        'email': 'resend@example.com',
        'purpose': 'first_login_verify'
    })
    assert res.status_code == 200

    db.session.refresh(user)
    assert user.otp_code is not None


def test_verify_email_token_flow(app, client):
    # Register user
    client.post('/api/v1/auth/register', json={
        'name': 'Verify Test User',
        'email': 'verifytest@example.com',
        'password': 'Password123!',
        'role': 'recruiter'
    })

    user = User.query.filter_by(email='verifytest@example.com').first()
    assert user.is_active is False

    with app.app_context():
        token = EmailService.generate_verification_token(user.id, user.email)

    # Verify email
    res = client.post('/api/v1/auth/verify-email', json={'token': token})
    assert res.status_code == 200
    assert res.get_json()['success'] is True

    # Now login should succeed
    login_res = client.post('/api/v1/auth/login', json={
        'email': 'verifytest@example.com',
        'password': 'Password123!'
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert login_data['success'] is True
    assert 'token' in login_data['data']
    assert login_data['data']['user']['email'] == 'verifytest@example.com'


def test_forgot_and_reset_password_flow(app, client, candidate_user):
    # Request forgot password (generates OTP)
    res = client.post('/api/v1/auth/forgot-password', json={
        'email': candidate_user.email
    })
    assert res.status_code == 200

    user = User.query.filter_by(email=candidate_user.email).first()
    reset_otp = user.otp_code
    assert reset_otp is not None

    # Reset with weak password should fail
    weak_res = client.post('/api/v1/auth/reset-password', json={
        'email': candidate_user.email,
        'otp': reset_otp,
        'password': 'weak'
    })
    assert weak_res.status_code == 400

    # Reset with strong password via OTP should succeed
    reset_res = client.post('/api/v1/auth/reset-password', json={
        'email': candidate_user.email,
        'otp': reset_otp,
        'password': 'BrandNewPassword123!'
    })
    assert reset_res.status_code == 200

    # Old password should fail
    old_login = client.post('/api/v1/auth/login', json={
        'email': candidate_user.email,
        'password': 'CandidatePass123!'
    })
    assert old_login.status_code == 401

    # New password should succeed
    new_login = client.post('/api/v1/auth/login', json={
        'email': candidate_user.email,
        'password': 'BrandNewPassword123!'
    })
    assert new_login.status_code == 200


def test_get_me_endpoint(client, candidate_user, auth_header):
    headers = auth_header(candidate_user)
    res = client.get('/api/v1/auth/me', headers=headers)
    assert res.status_code == 200
    data = res.get_json()['data']
    assert data['user']['email'] == candidate_user.email
    assert data['user']['role'] == 'candidate'
