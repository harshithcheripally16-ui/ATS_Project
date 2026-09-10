from flask import Blueprint, request
from ..models import db, CandidateProfile, User
from ..services import get_storage_service
from ..utils import (
    success_response,
    error_response,
    token_required,
    roles_allowed
)

candidates_bp = Blueprint('candidates', __name__, url_prefix='/api/v1/candidates')

@candidates_bp.route('/me', methods=['GET'])
@token_required
@roles_allowed('candidate')
def get_my_profile(current_user: User):
    """
    Get candidate profile of authenticated user
    ---
    tags:
      - Candidate Profile
    security:
      - Bearer: []
    responses:
      200:
        description: Profile details
    """
    profile = CandidateProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.session.add(profile)
        db.session.commit()

    return success_response(data={'profile': profile.to_dict()})


@candidates_bp.route('/me', methods=['PUT'])
@token_required
@roles_allowed('candidate')
def update_my_profile(current_user: User):
    """
    Update candidate profile details
    ---
    tags:
      - Candidate Profile
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            phone:
              type: string
            skills:
              type: string
              example: Python, SQL, REST APIs, Git
            experience:
              type: string
              example: 3 years as Full Stack Engineer at Tech Corp
            education:
              type: string
              example: B.S. in Computer Science, University of Technology
    responses:
      200:
        description: Profile updated successfully
    """
    data = request.get_json() or {}
    profile = CandidateProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.session.add(profile)

    if 'name' in data and data['name'].strip():
        current_user.name = data['name'].strip()

    if 'phone' in data:
        current_user.phone = data['phone'].strip() or None

    if 'skills' in data:
        profile.skills = (data['skills'] or '').strip()

    if 'experience' in data:
        profile.experience = (data['experience'] or '').strip() or None

    if 'education' in data:
        profile.education = (data['education'] or '').strip() or None

    db.session.commit()
    return success_response(data={'profile': profile.to_dict()}, message="Profile updated successfully")


@candidates_bp.route('/me/resume', methods=['POST'])
@token_required
@roles_allowed('candidate')
def upload_resume(current_user: User):
    """
    Upload resume document (PDF, DOCX)
    ---
    tags:
      - Candidate Profile
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: resume
        type: file
        required: true
        description: PDF or Word document resume
    responses:
      200:
        description: Resume uploaded successfully
      400:
        description: Invalid file format or missing file
    """
    if 'resume' not in request.files:
        return error_response("No resume file uploaded. Form field name must be 'resume'.", 400)

    file = request.files['resume']
    if not file or file.filename == '':
        return error_response("No file selected for upload.", 400)

    storage = get_storage_service()
    try:
        profile = CandidateProfile.query.filter_by(user_id=current_user.id).first()
        if not profile:
            profile = CandidateProfile(user_id=current_user.id)
            db.session.add(profile)

        # Delete previous resume file if one exists
        if profile.resume_url:
            storage.delete_file(profile.resume_url)

        file_url = storage.save_file(file, subfolder='resumes')
        profile.resume_url = file_url
        db.session.commit()

        return success_response(
            data={'resume_url': file_url, 'profile': profile.to_dict()},
            message="Resume uploaded successfully"
        )
    except ValueError as ve:
        return error_response(str(ve), 400)
    except Exception as e:
        return error_response(f"Failed to upload resume: {str(e)}", 500)
