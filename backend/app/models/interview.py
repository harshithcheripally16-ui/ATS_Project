from datetime import datetime, timezone
from .user import db

class Interview(db.Model):
    __tablename__ = 'interviews'

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(50), nullable=False)  # e.g., "14:00" or "02:00 PM"
    mode = db.Column(db.Enum('online', 'in-person', 'phone', name='interview_mode'), default='online', nullable=False)
    status = db.Column(db.Enum('scheduled', 'completed', 'cancelled', name='interview_status'), default='scheduled', nullable=False)
    notes = db.Column(db.Text, nullable=True)  # Meeting link or location instructions
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self, include_application=False):
        data = {
            'id': self.id,
            'application_id': self.application_id,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time,
            'mode': self.mode,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_application and self.application:
            data['application'] = self.application.to_dict(include_details=True)
        return data
