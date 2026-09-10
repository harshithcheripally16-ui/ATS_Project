import logging
from datetime import datetime, timezone
from flask import Blueprint, request
from ..models import db, Application, Job, CandidateProfile, User, OfferLetter
from ..services import ApplicationStateMachine, EmailService
from ..utils import (
    success_response,
    error_response,
    paginated_response,
    token_required,
    roles_allowed
)

logger = logging.getLogger('ApplicationsRoute')

applications_bp = Blueprint('applications', __name__, url_prefix='/api/v1')

@applications_bp.route('/applications', methods=['POST'])
@token_required
@roles_allowed('candidate')
def apply_to_job(current_user: User):
    resume_file = None
    if request.content_type and 'multipart/form-data' in request.content_type:
        job_id = request.form.get('job_id')
        resume_file = request.files.get('resume')
    else:
        data = request.get_json() or {}
        job_id = data.get('job_id')

    if not job_id:
        return error_response("job_id is required", 400)

    try:
        job_id = int(job_id)
    except ValueError:
        return error_response("Invalid job_id", 400)

    job = db.session.get(Job, job_id)
    if not job:
        return error_response("Job posting not found", 404)

    if job.status != 'open':
        return error_response(f"Cannot apply: this job posting is currently '{job.status}'", 400)

    profile = CandidateProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.session.add(profile)
        db.session.flush()

    # Process resume file if uploaded with this application
    if resume_file and resume_file.filename != '':
        from ..services import get_storage_service
        storage = get_storage_service()
        try:
            if profile.resume_url:
                storage.delete_file(profile.resume_url)
            file_url = storage.save_file(resume_file, subfolder='resumes')
            profile.resume_url = file_url
            db.session.flush()
        except ValueError as ve:
            return error_response(str(ve), 400)
        except Exception as e:
            logger.error(f"Failed to save resume during application: {e}")
            return error_response(f"Failed to upload resume: {str(e)}", 500)

    existing = Application.query.filter_by(candidate_id=profile.id, job_id=job.id).first()
    if existing:
        return error_response("You have already applied for this job posting.", 400)

    application = Application(
        candidate_id=profile.id,
        job_id=job.id,
        status='applied',
        applied_date=datetime.now(timezone.utc)
    )
    db.session.add(application)
    db.session.commit()

    return success_response(
        data={'application': application.to_dict()},
        message="Application submitted successfully",
        status_code=201
    )


@applications_bp.route('/applications/me', methods=['GET'])
@token_required
@roles_allowed('candidate')
def get_my_applications(current_user: User):
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10

    profile = CandidateProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return paginated_response(items=[], page=page, limit=limit, total=0)

    query = Application.query.filter_by(candidate_id=profile.id)

    status = request.args.get('status')
    if status and status in ApplicationStateMachine.VALID_STATUSES:
        query = query.filter_by(status=status)

    total = query.count()
    apps = query.order_by(Application.applied_date.desc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        items=[app.to_dict() for app in apps],
        page=page,
        limit=limit,
        total=total
    )


@applications_bp.route('/applications', methods=['GET'])
@token_required
@roles_allowed('recruiter', 'admin')
def get_all_applications(current_user: User):
    """List candidate applications across all jobs for the authenticated recruiter or admin."""
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(200, max(1, int(request.args.get('limit', 50))))
    except ValueError:
        page, limit = 1, 50

    query = Application.query.join(Job).join(CandidateProfile).join(User, CandidateProfile.user_id == User.id)

    scope = request.args.get('scope', 'all')
    if scope == 'mine' and current_user.role == 'recruiter':
        query = query.filter(Job.recruiter_id == current_user.id)

    job_id = request.args.get('job_id')
    if job_id:
        try:
            query = query.filter(Application.job_id == int(job_id))
        except ValueError:
            pass

    status = request.args.get('status')
    if status and status in ApplicationStateMachine.VALID_STATUSES:
        query = query.filter(Application.status == status)

    search = request.args.get('search')
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            db.or_(
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                Job.title.ilike(search_pattern),
                CandidateProfile.skills.ilike(search_pattern)
            )
        )

    sort_by = request.args.get('sort', 'newest')
    if sort_by in ('match', 'highest_match'):
        all_apps = query.all()
        all_apps.sort(key=lambda a: ((a.get_ats_match() or {}).get('score', 0), a.applied_date or datetime.min), reverse=True)
        total = len(all_apps)
        start = (page - 1) * limit
        apps = all_apps[start:start + limit]
    elif sort_by == 'oldest':
        total = query.count()
        apps = query.order_by(Application.applied_date.asc()).offset((page - 1) * limit).limit(limit).all()
    else:
        total = query.count()
        apps = query.order_by(Application.applied_date.desc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        items=[app.to_dict() for app in apps],
        page=page,
        limit=limit,
        total=total
    )


@applications_bp.route('/jobs/<int:job_id>/applications', methods=['GET'])
@token_required
@roles_allowed('recruiter', 'admin')
def get_job_applicants(job_id: int, current_user: User):
    job = db.session.get(Job, job_id)
    if not job:
        return error_response("Job posting not found", 404)

    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10

    query = Application.query.filter_by(job_id=job.id)

    status = request.args.get('status')
    if status and status in ApplicationStateMachine.VALID_STATUSES:
        query = query.filter_by(status=status)

    sort_by = request.args.get('sort', 'newest')
    if sort_by in ('match', 'highest_match'):
        all_apps = query.all()
        all_apps.sort(key=lambda a: ((a.get_ats_match() or {}).get('score', 0), a.applied_date or datetime.min), reverse=True)
        total = len(all_apps)
        start = (page - 1) * limit
        apps = all_apps[start:start + limit]
    elif sort_by == 'oldest':
        total = query.count()
        apps = query.order_by(Application.applied_date.asc()).offset((page - 1) * limit).limit(limit).all()
    else:
        total = query.count()
        apps = query.order_by(Application.applied_date.desc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        items=[app.to_dict() for app in apps],
        page=page,
        limit=limit,
        total=total
    )


@applications_bp.route('/applications/<int:app_id>/status', methods=['PATCH'])
@token_required
@roles_allowed('recruiter', 'admin')
def update_application_status(app_id: int, current_user: User):
    app = db.session.get(Application, app_id)
    if not app:
        return error_response("Application not found", 404)

    if current_user.role == 'recruiter' and app.job.recruiter_id != current_user.id:
        return error_response("You do not have permission to modify applications for this job posting", 403)

    data = request.get_json() or {}
    target_status = (data.get('status') or '').strip().lower()

    if not target_status:
        return error_response("Target status is required", 400)

    old_status = app.status
    can_trans, reason = ApplicationStateMachine.can_transition(old_status, target_status)
    if not can_trans:
        return error_response(f"State transition rejected: {reason}", 400)

    app.status = target_status
    if 'recruiter_remarks' in data:
        app.recruiter_remarks = (data['recruiter_remarks'] or '').strip()

    db.session.commit()

    if old_status != target_status and target_status in ('shortlisted', 'rejected', 'selected'):
        try:
            candidate_user = app.candidate.user
            EmailService.send_status_update_email(
                candidate_name=candidate_user.name,
                candidate_email=candidate_user.email,
                job_title=app.job.title,
                new_status=target_status,
                remarks=app.recruiter_remarks
            )
        except Exception as e:
            logger.error(f"Failed to dispatch status update email: {str(e)}")

    return success_response(
        data={'application': app.to_dict()},
        message=f"Application status updated to '{target_status}'"
    )


@applications_bp.route('/applications/<int:app_id>/offer', methods=['POST'])
@token_required
@roles_allowed('recruiter', 'admin')
def provide_offer_letter(app_id: int, current_user: User):
    """Create or update formal offer letter for candidate application."""
    app = db.session.get(Application, app_id)
    if not app:
        return error_response("Application not found", 404)

    # Ownership check: only job owner or admin can issue offer
    if current_user.role == 'recruiter' and app.job.recruiter_id != current_user.id:
        return error_response("You do not have permission to provide an offer letter for this application", 403)

    # Parse JSON or multipart form
    offer_file = None
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        offer_file = request.files.get('offer_document') or request.files.get('document')
    else:
        data = request.get_json() or {}

    position_title = (data.get('position_title') or app.job.title or '').strip()
    salary = (data.get('salary') or app.job.salary or '').strip()
    joining_date_str = data.get('joining_date')
    department = (data.get('department') or '').strip() or None
    employment_type = (data.get('employment_type') or 'Full-Time').strip()
    location = (data.get('location') or app.job.location or 'Remote').strip()
    reporting_manager = (data.get('reporting_manager') or '').strip() or None
    benefits = (data.get('benefits') or '').strip() or None
    terms = (data.get('terms') or '').strip() or None

    if not position_title:
        return error_response("Position title is required", 400)
    if not salary:
        return error_response("Salary/compensation is required", 400)
    if not joining_date_str:
        return error_response("Joining date is required", 400)

    try:
        joining_date = datetime.strptime(joining_date_str, '%Y-%m-%d').date()
    except ValueError:
        return error_response("Invalid joining_date format. Expected YYYY-MM-DD", 400)

    # Process optional document upload
    document_url = None
    if offer_file and offer_file.filename != '':
        from ..services import get_storage_service
        storage = get_storage_service()
        try:
            document_url = storage.save_file(offer_file, subfolder='offer_letters')
        except ValueError as ve:
            return error_response(str(ve), 400)
        except Exception as e:
            logger.error(f"Failed to upload offer document: {e}")
            return error_response(f"Failed to upload offer document: {str(e)}", 500)

    # Create or update OfferLetter
    offer = app.offer_letter
    is_new = False
    if not offer:
        is_new = True
        offer = OfferLetter(
            application_id=app.id,
            position_title=position_title,
            department=department,
            employment_type=employment_type,
            salary=salary,
            joining_date=joining_date,
            location=location,
            reporting_manager=reporting_manager,
            benefits=benefits,
            terms=terms,
            document_url=document_url,
            status='pending'
        )
        db.session.add(offer)
    else:
        offer.position_title = position_title
        offer.department = department
        offer.employment_type = employment_type
        offer.salary = salary
        offer.joining_date = joining_date
        offer.location = location
        offer.reporting_manager = reporting_manager
        offer.benefits = benefits
        offer.terms = terms
        if document_url:
            offer.document_url = document_url
        offer.status = 'pending'

    # When offer letter is provided, mark application status as selected
    if app.status != 'selected':
        app.status = 'selected'

    db.session.commit()

    # Dispatch email notification to candidate
    try:
        cand_user = app.candidate.user
        EmailService.send_offer_letter_email(
            candidate_name=cand_user.name,
            candidate_email=cand_user.email,
            job_title=app.job.title,
            position_title=offer.position_title,
            salary=offer.salary,
            joining_date=offer.joining_date.isoformat(),
            location=offer.location
        )
    except Exception as e:
        logger.error(f"Failed to send offer letter email: {e}")

    return success_response(
        data={
            'offer_letter': offer.to_dict(),
            'application': app.to_dict()
        },
        message="Offer letter issued successfully",
        status_code=201 if is_new else 200
    )


@applications_bp.route('/applications/<int:app_id>/offer', methods=['GET'])
@token_required
def get_offer_letter(app_id: int, current_user: User):
    """Retrieve offer letter for an application."""
    app = db.session.get(Application, app_id)
    if not app:
        return error_response("Application not found", 404)

    # Permission check: Candidate (own), Recruiter (job owner), or Admin
    if current_user.role == 'candidate':
        if app.candidate.user_id != current_user.id:
            return error_response("You do not have permission to view this offer letter", 403)
    elif current_user.role == 'recruiter':
        if app.job.recruiter_id != current_user.id:
            return error_response("You do not have permission to view this offer letter", 403)

    if not app.offer_letter:
        return error_response("No offer letter has been provided for this application yet", 404)

    return success_response(data={
        'offer_letter': app.offer_letter.to_dict(),
        'application': app.to_dict()
    })


@applications_bp.route('/applications/<int:app_id>/offer/respond', methods=['PATCH'])
@token_required
@roles_allowed('candidate')
def respond_to_offer(app_id: int, current_user: User):
    """Candidate responds (accept or decline) to an offer letter."""
    app = db.session.get(Application, app_id)
    if not app:
        return error_response("Application not found", 404)

    if app.candidate.user_id != current_user.id:
        return error_response("You do not have permission to respond to this offer letter", 403)

    if not app.offer_letter:
        return error_response("No offer letter found for this application", 404)

    data = request.get_json() or {}
    decision = (data.get('status') or '').strip().lower()
    notes = (data.get('notes') or '').strip() or None

    if decision not in ('accepted', 'declined'):
        return error_response("Invalid response status. Allowed values: 'accepted', 'declined'", 400)

    offer = app.offer_letter
    offer.status = decision
    offer.candidate_notes = notes
    offer.responded_at = datetime.now(timezone.utc)

    db.session.commit()

    # Notify the recruiter
    try:
        recruiter = app.job.recruiter
        if recruiter:
            EmailService.send_offer_response_email(
                recruiter_name=recruiter.name,
                recruiter_email=recruiter.email,
                candidate_name=current_user.name,
                position_title=offer.position_title,
                response_status=decision,
                candidate_notes=notes
            )
    except Exception as e:
        logger.error(f"Failed to notify recruiter of offer response: {e}")

    return success_response(
        data={'offer_letter': offer.to_dict()},
        message=f"Job offer successfully {decision}."
    )
