from flask import Blueprint, request
from sqlalchemy import case
from ..models import db, User, Job, JobCategory, Application, Interview, CandidateProfile
from ..utils import (
    success_response,
    error_response,
    paginated_response,
    token_required,
    roles_allowed
)

admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')

# ----------------- User Management -----------------

@admin_bp.route('/users', methods=['GET'])
@token_required
@roles_allowed('admin')
def list_users(current_user: User):
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10

    query = User.query

    role = request.args.get('role')
    if role in ('admin', 'recruiter', 'candidate'):
        query = query.filter_by(role=role)

    is_active_str = request.args.get('is_active')
    if is_active_str is not None:
        if is_active_str.lower() in ('true', '1'):
            query = query.filter_by(is_active=True)
        elif is_active_str.lower() in ('false', '0'):
            query = query.filter_by(is_active=False)

    search = (request.args.get('search') or '').strip()
    if search:
        query = query.filter(
            (User.name.ilike(f'%{search}%')) | (User.email.ilike(f'%{search}%'))
        )

    total = query.count()

    # Order priority: Admin -> Recruiter -> Candidate -> Others, then newest first
    role_order = case(
        (User.role == 'admin', 1),
        (User.role == 'recruiter', 2),
        (User.role == 'candidate', 3),
        else_=4
    )
    users = query.order_by(role_order, User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        items=[u.to_dict() for u in users],
        page=page,
        limit=limit,
        total=total
    )


@admin_bp.route('/users', methods=['POST'])
@token_required
@roles_allowed('admin')
def create_user(current_user: User):
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role = data.get('role') or 'candidate'
    phone = (data.get('phone') or '').strip() or None
    is_active = bool(data.get('is_active', True))

    if not name:
        return error_response("Name is required", 400)
    if not email or '@' not in email:
        return error_response("Valid email is required", 400)
    if not password or len(password) < 6:
        return error_response("Password must be at least 6 characters", 400)
    if role not in ('admin', 'recruiter', 'candidate'):
        return error_response("Invalid role specified", 400)

    if User.query.filter_by(email=email).first():
        return error_response(f"User with email '{email}' already exists", 400)

    new_user = User(
        name=name,
        email=email,
        role=role,
        phone=phone,
        is_active=is_active
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.flush()

    if role == 'candidate':
        candidate_profile = CandidateProfile(user_id=new_user.id)
        db.session.add(candidate_profile)

    db.session.commit()

    return success_response(
        data={'user': new_user.to_dict()},
        message=f"User {new_user.email} created successfully",
        status_code=201
    )


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@roles_allowed('admin')
def update_user(user_id: int, current_user: User):
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}

    if 'name' in data:
        name = (data['name'] or '').strip()
        if not name:
            return error_response("Name cannot be empty", 400)
        user.name = name

    if 'email' in data:
        email = (data['email'] or '').strip().lower()
        if not email or '@' not in email:
            return error_response("Valid email is required", 400)
        existing = User.query.filter_by(email=email).first()
        if existing and existing.id != user.id:
            return error_response(f"Email '{email}' is already in use", 400)
        user.email = email

    if 'role' in data:
        new_role = data['role']
        if new_role not in ('admin', 'recruiter', 'candidate'):
            return error_response("Invalid role specified", 400)
        if user.id == current_user.id and new_role != 'admin':
            return error_response("Administrators cannot change their own admin role", 400)
        user.role = new_role

        # If role changed to candidate and profile does not exist, create it
        if new_role == 'candidate' and not user.candidate_profile:
            candidate_profile = CandidateProfile(user_id=user.id)
            db.session.add(candidate_profile)

    if 'phone' in data:
        user.phone = (data['phone'] or '').strip() or None

    if 'is_active' in data:
        if user.id == current_user.id and not bool(data['is_active']):
            return error_response("Administrators cannot deactivate their own account", 400)
        user.is_active = bool(data['is_active'])

    if 'password' in data and data['password']:
        pwd = data['password']
        if len(pwd) < 6:
            return error_response("Password must be at least 6 characters", 400)
        user.set_password(pwd)

    db.session.commit()

    return success_response(
        data={'user': user.to_dict()},
        message=f"User {user.email} updated successfully"
    )


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@roles_allowed('admin')
def delete_user(user_id: int, current_user: User):
    if user_id == current_user.id:
        return error_response("Administrators cannot remove their own account", 400)

    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found", 404)

    if user.role == 'admin':
        return error_response("Administrators cannot remove another administrator account", 403)

    user_email = user.email
    db.session.delete(user)
    db.session.commit()

    return success_response(message=f"User {user_email} has been removed successfully.")


@admin_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
@token_required
@roles_allowed('admin')
def update_user_status(user_id: int, current_user: User):
    if user_id == current_user.id:
        return error_response("Administrators cannot deactivate their own account", 400)

    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    if 'is_active' not in data:
        return error_response("'is_active' boolean flag is required", 400)

    user.is_active = bool(data['is_active'])
    db.session.commit()

    action = "activated" if user.is_active else "deactivated"
    return success_response(
        data={'user': user.to_dict()},
        message=f"User {user.email} has been {action}."
    )


# ----------------- System Jobs -----------------

@admin_bp.route('/jobs', methods=['GET'])
@token_required
@roles_allowed('admin')
def list_all_jobs(current_user: User):
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10

    query = Job.query
    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(
        items=[j.to_dict() for j in jobs],
        page=page,
        limit=limit,
        total=total
    )


# ----------------- Job Categories CRUD -----------------

@admin_bp.route('/categories', methods=['GET'])
def list_categories():
    categories = JobCategory.query.order_by(JobCategory.name.asc()).all()
    return success_response(data={'categories': [c.to_dict() for c in categories]})


@admin_bp.route('/categories', methods=['POST'])
@token_required
@roles_allowed('admin')
def create_category(current_user: User):
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip() or None

    if not name:
        return error_response("Category name is required", 400)

    if JobCategory.query.filter_by(name=name).first():
        return error_response(f"Category '{name}' already exists", 400)

    category = JobCategory(name=name, description=description)
    db.session.add(category)
    db.session.commit()

    return success_response(
        data={'category': category.to_dict()},
        message="Category created successfully",
        status_code=201
    )


@admin_bp.route('/categories/<int:category_id>', methods=['PUT'])
@token_required
@roles_allowed('admin')
def update_category(category_id: int, current_user: User):
    category = db.session.get(JobCategory, category_id)
    if not category:
        return error_response("Category not found", 404)

    data = request.get_json() or {}
    if 'name' in data:
        name = data['name'].strip()
        if not name:
            return error_response("Name cannot be empty", 400)
        existing = JobCategory.query.filter_by(name=name).first()
        if existing and existing.id != category.id:
            return error_response(f"Category '{name}' already exists", 400)
        category.name = name

    if 'description' in data:
        category.description = (data['description'] or '').strip() or None

    db.session.commit()
    return success_response(data={'category': category.to_dict()}, message="Category updated successfully")


@admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@token_required
@roles_allowed('admin')
def delete_category(category_id: int, current_user: User):
    category = db.session.get(JobCategory, category_id)
    if not category:
        return error_response("Category not found", 404)

    db.session.delete(category)
    db.session.commit()
    return success_response(message="Category deleted successfully")


# ----------------- System Stats -----------------

@admin_bp.route('/stats', methods=['GET'])
@token_required
@roles_allowed('admin')
def get_system_stats(current_user: User):
    total_users = User.query.count()
    candidates_count = User.query.filter_by(role='candidate').count()
    recruiters_count = User.query.filter_by(role='recruiter').count()
    total_jobs = Job.query.count()
    open_jobs = Job.query.filter_by(status='open').count()
    total_applications = Application.query.count()
    total_interviews = Interview.query.count()

    return success_response(data={
        'users': {
            'total': total_users,
            'candidates': candidates_count,
            'recruiters': recruiters_count
        },
        'jobs': {
            'total': total_jobs,
            'open': open_jobs
        },
        'applications': {
            'total': total_applications
        },
        'interviews': {
            'total': total_interviews
        }
    })
