from datetime import datetime, timedelta, timezone
import secrets
import bcrypt
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'recruiter', 'candidate', name='user_roles'), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # OTP for verification and password reset
    otp_code = db.Column(db.String(10), nullable=True)
    otp_expires_at = db.Column(db.DateTime, nullable=True)
    otp_purpose = db.Column(db.String(30), nullable=True)

    # Relationships
    candidate_profile = db.relationship('CandidateProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    jobs = db.relationship('Job', backref='recruiter', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password: str):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def generate_otp(self, purpose: str = 'first_login_verify', expires_minutes: int = 10) -> str:
        """Generate a secure 6-digit numeric OTP code."""
        code = f"{secrets.randbelow(900000) + 100000:06d}"
        self.otp_code = code
        self.otp_purpose = purpose
        self.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
        return code

    def verify_otp(self, code: str, purpose: str = 'first_login_verify') -> bool:
        """Verify given OTP code and check expiration."""
        if not self.otp_code or not self.otp_expires_at:
            return False
        if self.otp_purpose != purpose:
            return False
        
        # Ensure timezone-aware comparison
        now = datetime.now(timezone.utc)
        expires_at = self.otp_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:
            return False
        return str(self.otp_code).strip() == str(code).strip()

    def clear_otp(self):
        """Clear OTP after successful verification."""
        self.otp_code = None
        self.otp_expires_at = None
        self.otp_purpose = None

    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_sensitive:
            data['password_hash'] = self.password_hash
            data['otp_code'] = self.otp_code
        return data
