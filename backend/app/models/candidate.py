from datetime import datetime, timezone
from .user import db

class CandidateProfile(db.Model):
    __tablename__ = 'candidate_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    skills = db.Column(db.Text, nullable=True)  # Comma-separated skills
    experience = db.Column(db.Text, nullable=True)  # Experience summary or details
    education = db.Column(db.Text, nullable=True)  # Education history
    resume_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    applications = db.relationship('Application', backref='candidate', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_user=True):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'skills': [s.strip() for s in self.skills.split(',')] if self.skills else [],
            'skills_raw': self.skills or '',
            'experience': self.experience,
            'education': self.education,
            'resume_url': self.resume_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_user and self.user:
            data['name'] = self.user.name
            data['email'] = self.user.email
            data['phone'] = self.user.phone
        return data
