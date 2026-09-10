from datetime import datetime, timezone, date
from .user import db

class Job(db.Model):
    __tablename__ = 'jobs'

    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('job_categories.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    skills = db.Column(db.Text, nullable=True)  # Comma-separated or string list
    experience = db.Column(db.String(100), nullable=True)  # e.g., "2-4 years"
    location = db.Column(db.String(150), nullable=True, index=True)
    salary = db.Column(db.String(100), nullable=True)  # e.g., "$80,000 - $100,000" or fixed
    deadline = db.Column(db.Date, nullable=True)
    status = db.Column(db.Enum('open', 'closed', 'draft', name='job_status'), default='open', nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    applications = db.relationship('Application', backref='job', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_recruiter=True):
        data = {
            'id': self.id,
            'recruiter_id': self.recruiter_id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'title': self.title,
            'description': self.description,
            'skills': [s.strip() for s in self.skills.split(',')] if self.skills else [],
            'skills_raw': self.skills or '',
            'experience': self.experience,
            'location': self.location,
            'salary': self.salary,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'applicant_count': len(self.applications)
        }
        if include_recruiter and self.recruiter:
            data['recruiter'] = {
                'id': self.recruiter.id,
                'name': self.recruiter.name,
                'email': self.recruiter.email
            }
        return data
