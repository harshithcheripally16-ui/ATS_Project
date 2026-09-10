from datetime import datetime, timezone
from .user import db

class Application(db.Model):
    __tablename__ = 'applications'
    __table_args__ = (
        db.UniqueConstraint('candidate_id', 'job_id', name='uq_candidate_job_application'),
    )

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidate_profiles.id', ondelete='CASCADE'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    applied_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = db.Column(
        db.Enum('applied', 'shortlisted', 'rejected', 'interview_scheduled', 'selected', name='application_status'),
        default='applied',
        nullable=False
    )
    recruiter_remarks = db.Column(db.Text, nullable=True)

    # Relationships
    interviews = db.relationship('Interview', backref='application', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_details=True):
        data = {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'job_id': self.job_id,
            'applied_date': self.applied_date.isoformat() if self.applied_date else None,
            'status': self.status,
            'recruiter_remarks': self.recruiter_remarks
        }
        if include_details:
            if self.job:
                data['job'] = {
                    'id': self.job.id,
                    'title': self.job.title,
                    'location': self.job.location,
                    'salary': self.job.salary,
                    'recruiter_id': self.job.recruiter_id,
                    'recruiter_name': self.job.recruiter.name if self.job.recruiter else None
                }
            if self.candidate:
                data['candidate'] = {
                    'id': self.candidate.id,
                    'user_id': self.candidate.user_id,
                    'name': self.candidate.user.name if self.candidate.user else None,
                    'email': self.candidate.user.email if self.candidate.user else None,
                    'phone': self.candidate.user.phone if self.candidate.user else None,
                    'skills': [s.strip() for s in self.candidate.skills.split(',')] if self.candidate.skills else [],
                    'experience': self.candidate.experience,
                    'education': self.candidate.education,
                    'resume_url': self.candidate.resume_url
                }
            data['interviews'] = [interview.to_dict() for interview in self.interviews]
            data['offer_letter'] = self.offer_letter.to_dict() if self.offer_letter else None
            data['ats_match'] = self.get_ats_match()
        return data

    def get_ats_match(self):
        if self.candidate and self.job:
            from ..services.ats_matcher import AtsMatcherService
            return AtsMatcherService.calculate_match(self.candidate, self.job)
        return None

