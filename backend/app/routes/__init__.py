import os
from flask import Blueprint, send_from_directory, current_app
from .auth import auth_bp
from .jobs import jobs_bp
from .candidates import candidates_bp
from .applications import applications_bp
from .interviews import interviews_bp
from .admin import admin_bp
from ..utils import error_response

uploads_bp = Blueprint('uploads', __name__, url_prefix='/api/v1/uploads')

@uploads_bp.route('/resumes/<path:filename>', methods=['GET'])
def get_resume_file(filename):
    upload_dir = current_app.config['UPLOAD_FOLDER']
    if not os.path.exists(os.path.join(upload_dir, filename)):
        return error_response("File not found", 404)
    return send_from_directory(upload_dir, filename)

__all__ = [
    'auth_bp',
    'jobs_bp',
    'candidates_bp',
    'applications_bp',
    'interviews_bp',
    'admin_bp',
    'uploads_bp'
]
