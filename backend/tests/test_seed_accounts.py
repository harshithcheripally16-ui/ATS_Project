from app.models import User

def test_seed_demo_accounts_login(client):
    """
    Regression Test (Milestone K): Assert that seeded demo accounts exist,
    have is_active=True, and can log in immediately via API without verification errors.
    """
    demo_accounts = [
        ("admin@ats.com", "AdminPass123!", "admin"),
        ("recruiter@ats.com", "RecruiterPass123!", "recruiter"),
        ("candidate@ats.com", "CandidatePass123!", "candidate")
    ]

    for email, password, expected_role in demo_accounts:
        user = User.query.filter_by(email=email).first()
        assert user is not None, f"Seeded account {email} not found in database"
        assert user.is_active is True, f"Seeded account {email} is_active is False"
        assert user.role == expected_role, f"Seeded account {email} role is {user.role}, expected {expected_role}"

        # Attempt API Login
        res = client.post('/api/v1/auth/login', json={
            'email': email,
            'password': password
        })
        assert res.status_code == 200, f"Login failed for {email}: {res.get_json()}"
        data = res.get_json()['data']
        assert 'token' in data
        assert data['user']['email'] == email
        assert data['user']['role'] == expected_role
