import pytest
import os
import sys
from types import SimpleNamespace

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app
from app.config import TestConfig
from app.models import db, User, CandidateProfile, JobCategory, Job, Application, Interview
from app.utils import generate_auth_token

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def candidate_user(app):
    with app.app_context():
        user = User(
            name="Test Candidate",
            email="candidate@example.com",
            role="candidate",
            phone="+1234567890",
            is_active=True
        )
        user.set_password("CandidatePass123!")
        db.session.add(user)
        db.session.flush()

        profile = CandidateProfile(
            user_id=user.id,
            skills="Python, Flask, JavaScript, SQL",
            experience="3 years backend experience",
            education="B.S. Computer Science"
        )
        db.session.add(profile)
        db.session.commit()
        return SimpleNamespace(id=user.id, email=user.email, role=user.role, name=user.name)

@pytest.fixture
def recruiter_user(app):
    with app.app_context():
        user = User(
            name="Test Recruiter",
            email="recruiter@example.com",
            role="recruiter",
            phone="+1987654321",
            is_active=True
        )
        user.set_password("RecruiterPass123!")
        db.session.add(user)
        db.session.commit()
        return SimpleNamespace(id=user.id, email=user.email, role=user.role, name=user.name)

@pytest.fixture
def recruiter2_user(app):
    with app.app_context():
        user = User(
            name="Other Recruiter",
            email="recruiter2@example.com",
            role="recruiter",
            phone="+1987654322",
            is_active=True
        )
        user.set_password("Recruiter2Pass123!")
        db.session.add(user)
        db.session.commit()
        return SimpleNamespace(id=user.id, email=user.email, role=user.role, name=user.name)

@pytest.fixture
def admin_user(app):
    with app.app_context():
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            admin = User(
                name="Admin User",
                email="admin@ats.com",
                role="admin",
                is_active=True
            )
            admin.set_password("AdminPass123!")
            db.session.add(admin)
            db.session.commit()
        return SimpleNamespace(id=admin.id, email=admin.email, role=admin.role, name=admin.name)

@pytest.fixture
def auth_header(app):
    def _auth_header(user_obj):
        with app.app_context():
            user_id = user_obj.id if hasattr(user_obj, 'id') else user_obj['id']
            user = db.session.get(User, user_id)
            token = generate_auth_token(user)
            return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    return _auth_header
