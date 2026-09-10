from datetime import datetime, timezone
from .user import db

class JobCategory(db.Model):
    __tablename__ = 'job_categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    jobs = db.relationship('Job', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'job_count': len(self.jobs),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
