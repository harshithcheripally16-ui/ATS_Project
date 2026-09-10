from datetime import datetime
from flask import Blueprint, request
from sqlalchemy import or_
from ..models import db, Job, JobCategory, User
from ..utils import (
    success_response,
    error_response,
    paginated_response,
    token_required,
    roles_allowed
)

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/v1/jobs')

@jobs_bp.route('', methods=['POST'])
@token_required
@roles_allowed('recruiter')
def create_job(current_user: User):
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()

    if not title or not description:
        return error_response("Job title and description are required", 400)

    category_id = data.get('category_id')
    if category_id:
        category = db.session.get(JobCategory, category_id)
        if not category:
            return error_response(f"Job Category with ID {category_id} not found", 400)

    deadline = None
    if data.get('deadline'):
        try:
            deadline = datetime.strptime(data['deadline'], '%Y-%m-%d').date()
        except ValueError:
            return error_response("Invalid deadline format. Expected YYYY-MM-DD", 400)

    status = data.get('status', 'open').lower()
    if status not in ('open', 'closed', 'draft'):
        return error_response("Invalid status. Allowed values: 'open', 'closed', 'draft'", 400)

    job = Job(
        recruiter_id=current_user.id,
        category_id=category_id,
        title=title,
        description=description,
        skills=data.get('skills', '').strip(),
        experience=data.get('experience', '').strip() or None,
        location=data.get('location', '').strip() or None,
        salary=data.get('salary', '').strip() or None,
        deadline=deadline,
        status=status
    )
    db.session.add(job)
    db.session.commit()

    return success_response(
        data={'job': job.to_dict()},
        message="Job posting created successfully",
        status_code=201
    )


@jobs_bp.route('', methods=['GET'])
def list_jobs():
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10

    query = Job.query

    status = request.args.get('status', 'open').lower()
    if status != 'all':
        query = query.filter(Job.status == status)

    category_id = request.args.get('category_id')
    if category_id:
        query = query.filter(Job.category_id == category_id)

    skill = request.args.get('skill', '').strip()
    if skill:
        query = query.filter(Job.skills.ilike(f"%{skill}%"))

    location = request.args.get('location', '').strip()
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))

    experience = request.args.get('experience', '').strip()
    if experience:
        query = query.filter(Job.experience.ilike(f"%{experience}%"))

    keyword = request.args.get('keyword', '').strip()
    if keyword:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{keyword}%"),
                Job.description.ilike(f"%{keyword}%"),
                Job.skills.ilike(f"%{keyword}%")
            )
        )

    recruiter_id = request.args.get('recruiter_id')
    if recruiter_id:
        query = query.filter(Job.recruiter_id == recruiter_id)

    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = [job.to_dict() for job in jobs]
    return paginated_response(items=items, page=page, limit=limit, total=total)


@jobs_bp.route('/my-jobs', methods=['GET'])
@token_required
@roles_allowed('recruiter', 'admin')
def get_recruiter_jobs(current_user: User):
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10

    scope = request.args.get('scope', 'all')
    if scope == 'mine' and current_user.role == 'recruiter':
        query = Job.query.filter_by(recruiter_id=current_user.id)
    else:
        # Whichever job postings are on candidates platform must be available in recruiter platform
        query = Job.query

    status = request.args.get('status')
    if status and status in ('open', 'closed', 'draft'):
        query = query.filter_by(status=status)

    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        items=[job.to_dict() for job in jobs],
        page=page,
        limit=limit,
        total=total
    )


@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job_detail(job_id: int):
    job = db.session.get(Job, job_id)
    if not job:
        return error_response("Job posting not found", 404)
    return success_response(data={'job': job.to_dict()})


@jobs_bp.route('/<int:job_id>', methods=['PUT'])
@token_required
@roles_allowed('recruiter')
def update_job(job_id: int, current_user: User):
    job = db.session.get(Job, job_id)
    if not job:
        return error_response("Job posting not found", 404)

    if job.recruiter_id != current_user.id:
        return error_response("You do not have permission to edit this job posting", 403)

    data = request.get_json() or {}
    if 'title' in data:
        title = data['title'].strip()
        if not title:
            return error_response("Title cannot be empty", 400)
        job.title = title

    if 'description' in data:
        desc = data['description'].strip()
        if not desc:
            return error_response("Description cannot be empty", 400)
        job.description = desc

    if 'category_id' in data:
        cat_id = data['category_id']
        if cat_id:
            if not db.session.get(JobCategory, cat_id):
                return error_response("Invalid category ID", 400)
        job.category_id = cat_id

    if 'skills' in data:
        job.skills = (data['skills'] or '').strip()

    if 'experience' in data:
        job.experience = (data['experience'] or '').strip() or None

    if 'location' in data:
        job.location = (data['location'] or '').strip() or None

    if 'salary' in data:
        job.salary = (data['salary'] or '').strip() or None

    if 'deadline' in data:
        if data['deadline']:
            try:
                job.deadline = datetime.strptime(data['deadline'], '%Y-%m-%d').date()
            except ValueError:
                return error_response("Invalid deadline format. Expected YYYY-MM-DD", 400)
        else:
            job.deadline = None

    if 'status' in data:
        status = (data['status'] or '').lower()
        if status not in ('open', 'closed', 'draft'):
            return error_response("Invalid status value", 400)
        job.status = status

    db.session.commit()
    return success_response(data={'job': job.to_dict()}, message="Job updated successfully")


@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
@token_required
@roles_allowed('recruiter')
def delete_job(job_id: int, current_user: User):
    job = db.session.get(Job, job_id)
    if not job:
        return error_response("Job posting not found", 404)

    if job.recruiter_id != current_user.id:
        return error_response("You do not have permission to delete this job posting", 403)

    db.session.delete(job)
    db.session.commit()
    return success_response(message="Job posting deleted successfully")
