from datetime import datetime, timezone
from .user import db

class OfferLetter(db.Model):
    __tablename__ = 'offer_letters'

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id', ondelete='CASCADE'), unique=True, nullable=False)
    position_title = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100), nullable=True)
    employment_type = db.Column(db.String(50), default='Full-Time', nullable=False)
    salary = db.Column(db.String(100), nullable=False)
    joining_date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(150), nullable=True)
    reporting_manager = db.Column(db.String(150), nullable=True)
    benefits = db.Column(db.Text, nullable=True)
    terms = db.Column(db.Text, nullable=True)
    document_url = db.Column(db.String(255), nullable=True)
    status = db.Column(db.Enum('pending', 'accepted', 'declined', name='offer_status'), default='pending', nullable=False)
    candidate_notes = db.Column(db.Text, nullable=True)
    responded_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    application = db.relationship('Application', backref=db.backref('offer_letter', uselist=False, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'position_title': self.position_title,
            'department': self.department,
            'employment_type': self.employment_type,
            'salary': self.salary,
            'joining_date': self.joining_date.isoformat() if self.joining_date else None,
            'location': self.location,
            'reporting_manager': self.reporting_manager,
            'benefits': self.benefits,
            'terms': self.terms,
            'document_url': self.document_url,
            'status': self.status,
            'candidate_notes': self.candidate_notes,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
