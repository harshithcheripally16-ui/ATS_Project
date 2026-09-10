import logging
from datetime import datetime
from flask import Blueprint, request
from ..models import db, Interview, Application, CandidateProfile, User
from ..services import ApplicationStateMachine, EmailService
from ..utils import (
    success_response,
    error_response,
    paginated_response,
    token_required,
    roles_allowed
)

logger = logging.getLogger('InterviewsRoute')

interviews_bp = Blueprint('interviews', __name__, url_prefix='/api/v1/interviews')

@interviews_bp.route('', methods=['POST'])
@token_required
@roles_allowed('recruiter')
def schedule_interview(current_user: User):
    data = request.get_json() or {}
    app_id = data.get('application_id')
    date_str = data.get('date')
    time_str = data.get('time')
    mode = (data.get('mode') or 'online').lower()
    notes = (data.get('notes') or '').strip() or None

    if not app_id or not date_str or not time_str:
        return error_response("application_id, date, and time are required", 400)

    try:
        interview_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return error_response("Invalid date format. Expected YYYY-MM-DD", 400)

    if mode not in ('online', 'in-person', 'phone'):
        return error_response("Mode must be 'online', 'in-person', or 'phone'", 400)

    application = db.session.get(Application, app_id)
    if not application:
        return error_response("Application not found", 404)

    if current_user.role not in ('recruiter', 'admin'):
        return error_response("You do not have permission to schedule interviews for this applicant", 403)

    if application.status != 'interview_scheduled':
        can_trans, reason = ApplicationStateMachine.can_transition(application.status, 'interview_scheduled')
        if not can_trans:
            return error_response(f"Cannot schedule interview: {reason}. Candidate must be shortlisted first.", 400)
        application.status = 'interview_scheduled'

    interview = Interview(
        application_id=application.id,
        date=interview_date,
        time=time_str.strip(),
        mode=mode,
        status='scheduled',
        notes=notes
    )
    db.session.add(interview)
    db.session.commit()

    try:
        candidate_user = application.candidate.user
        EmailService.send_interview_scheduled_email(
            candidate_name=candidate_user.name,
            candidate_email=candidate_user.email,
            job_title=application.job.title,
            date=str(interview.date),
            time=interview.time,
            mode=interview.mode,
            notes=interview.notes,
            is_rescheduled=False,
            is_cancelled=False
        )
    except Exception as e:
        logger.error(f"Failed to dispatch interview scheduled email: {str(e)}")

    return success_response(
        data={'interview': interview.to_dict(include_application=True)},
        message="Interview scheduled successfully",
        status_code=201
    )


@interviews_bp.route('/me', methods=['GET'])
@token_required
@roles_allowed('candidate')
def get_my_interviews(current_user: User):
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10

    profile = CandidateProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return paginated_response(items=[], page=page, limit=limit, total=0)

    query = Interview.query.join(Application).filter(Application.candidate_id == profile.id)
    total = query.count()
    interviews = query.order_by(Interview.date.asc(), Interview.time.asc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        items=[i.to_dict(include_application=True) for i in interviews],
        page=page,
        limit=limit,
        total=total
    )


@interviews_bp.route('/recruiter', methods=['GET'])
@token_required
@roles_allowed('recruiter')
def get_recruiter_interviews(current_user: User):
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10

    from ..models import Job
    query = Interview.query.join(Application).join(Job).filter(Job.recruiter_id == current_user.id)
    total = query.count()
    interviews = query.order_by(Interview.date.asc(), Interview.time.asc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        items=[i.to_dict(include_application=True) for i in interviews],
        page=page,
        limit=limit,
        total=total
    )


@interviews_bp.route('/<int:interview_id>', methods=['PATCH'])
@token_required
@roles_allowed('recruiter')
def update_interview(interview_id: int, current_user: User):
    interview = db.session.get(Interview, interview_id)
    if not interview:
        return error_response("Interview not found", 404)

    if interview.application.job.recruiter_id != current_user.id:
        return error_response("You do not have permission to modify this interview", 403)

    data = request.get_json() or {}
    is_rescheduled = False
    is_cancelled = False

    if ('date' in data and data['date']) or ('time' in data and data['time']):
        is_rescheduled = True

    if 'status' in data and data['status'] == 'cancelled':
        is_cancelled = True

    if 'date' in data and data['date']:
        try:
            interview.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return error_response("Invalid date format. Expected YYYY-MM-DD", 400)

    if 'time' in data and data['time']:
        interview.time = data['time'].strip()

    if 'mode' in data and data['mode']:
        mode = data['mode'].lower()
        if mode not in ('online', 'in-person', 'phone'):
            return error_response("Mode must be 'online', 'in-person', or 'phone'", 400)
        interview.mode = mode

    if 'status' in data and data['status']:
        status = data['status'].lower()
        if status not in ('scheduled', 'completed', 'cancelled'):
            return error_response("Status must be 'scheduled', 'completed', or 'cancelled'", 400)
        interview.status = status

    if 'notes' in data:
        interview.notes = (data['notes'] or '').strip() or None

    db.session.commit()

    if is_rescheduled or is_cancelled:
        try:
            candidate_user = interview.application.candidate.user
            EmailService.send_interview_scheduled_email(
                candidate_name=candidate_user.name,
                candidate_email=candidate_user.email,
                job_title=interview.application.job.title,
                date=str(interview.date),
                time=interview.time,
                mode=interview.mode,
                notes=interview.notes,
                is_rescheduled=is_rescheduled and not is_cancelled,
                is_cancelled=is_cancelled
            )
        except Exception as e:
            logger.error(f"Failed to dispatch interview update email: {str(e)}")

    return success_response(
        data={'interview': interview.to_dict(include_application=True)},
        message="Interview details updated successfully"
    )
