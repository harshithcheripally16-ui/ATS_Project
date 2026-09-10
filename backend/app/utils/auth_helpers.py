from functools import wraps
from datetime import datetime, timezone
import jwt
from flask import request, current_app
from ..models import db, User
from .responses import error_response

def generate_auth_token(user: User) -> str:
    """Generate a JWT access token for authenticated user sessions."""
    secret = current_app.config['JWT_SECRET_KEY']
    expires = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
    now = datetime.now(timezone.utc)
    
    payload = {
        'user_id': user.id if hasattr(user, 'id') else user['id'],
        'email': user.email if hasattr(user, 'email') else user['email'],
        'role': user.role if hasattr(user, 'role') else user['role'],
        'name': user.name if hasattr(user, 'name') else user['name'],
        'iat': now,
        'exp': now + expires
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def decode_auth_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    secret = current_app.config['JWT_SECRET_KEY']
    return jwt.decode(token, secret, algorithms=['HS256'])

def token_required(f):
    """Decorator to require a valid Bearer JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return error_response("Authorization token is missing", 401)

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return error_response("Invalid Authorization header format. Expected 'Bearer <token>'", 401)

        token = parts[1]
        try:
            payload = decode_auth_token(token)
        except jwt.ExpiredSignatureError:
            return error_response("Session token has expired. Please log in again.", 401)
        except jwt.InvalidTokenError:
            return error_response("Invalid authentication token.", 401)

        user_id = payload.get('user_id')
        user = db.session.get(User, user_id)
        if not user:
            return error_response("User account not found.", 401)

        if not user.is_active:
            return error_response("Account is inactive or not verified.", 403)

        return f(current_user=user, *args, **kwargs)
    return decorated

def roles_allowed(*allowed_roles):
    """Decorator to restrict endpoint access to specific roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                return error_response("Authentication required", 401)
            
            if current_user.role not in allowed_roles:
                return error_response(
                    f"Access forbidden: requires one of [{', '.join(allowed_roles)}] role, but you are '{current_user.role}'",
                    403
                )
            return f(*args, **kwargs)
        return decorated
    return decorator
