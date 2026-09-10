import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file from project root or backend directory if present
load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'ats-secret-key-development-mode-9923')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'ats-jwt-secret-key-development-mode-8812')
    
    # Token TTLs
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', '24')))
    VERIFY_TOKEN_EXPIRES_HOURS = int(os.getenv('VERIFY_TOKEN_EXPIRES_HOURS', '24'))
    RESET_TOKEN_EXPIRES_MINUTES = int(os.getenv('RESET_TOKEN_EXPIRES_MINUTES', '60'))
    
    # Database configuration
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        db_path = os.path.join(BASE_DIR, 'ats_dev.db')
        DATABASE_URL = f"sqlite:///{db_path}"
    
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File Storage
    UPLOAD_FOLDER = os.path.join(BASE_DIR, os.getenv('UPLOAD_FOLDER', 'uploads/resumes'))
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 10 * 1024 * 1024)) # 10MB
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'pdf,docx,doc').split(','))
    
    # SMTP Email Configuration
    SMTP_HOST = os.getenv('SMTP_HOST', '')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    SMTP_FROM = os.getenv('SMTP_FROM', 'no-reply@ats-portal.com')
    SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'True').lower() in ('true', '1', 't')
    
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://127.0.0.1:5000')

    # Swagger / OpenAPI Spec
    SWAGGER_TEMPLATE = {
        "swagger": "2.0",
        "info": {
            "title": "ATS REST API",
            "description": "Recruitment & Applicant Tracking System (ATS) Role-Based REST API Specification",
            "version": "1.1.0"
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
            }
        }
    }

    SWAGGER_CONFIG = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_1',
                "route": '/apispec_1.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/api/docs"
    }

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SMTP_HOST = ''
