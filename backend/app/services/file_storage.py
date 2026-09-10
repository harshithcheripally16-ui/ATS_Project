import os
import uuid
from abc import ABC, abstractmethod
from werkzeug.utils import secure_filename
from flask import current_app

class BaseFileStorage(ABC):
    @abstractmethod
    def save_file(self, file_storage, subfolder: str = 'resumes') -> str:
        """Save an uploaded file and return its access path/URL."""
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """Delete a file given its path/URL."""
        pass

class LocalFileStorage(BaseFileStorage):
    def __init__(self, base_folder: str = None):
        self._base_folder = base_folder

    @property
    def base_folder(self):
        if self._base_folder:
            return self._base_folder
        return current_app.config['UPLOAD_FOLDER']

    def is_allowed_file(self, filename: str) -> bool:
        allowed = current_app.config.get('ALLOWED_EXTENSIONS', {'pdf', 'docx', 'doc'})
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed

    def save_file(self, file_storage, subfolder: str = 'resumes') -> str:
        if not file_storage or not file_storage.filename:
            raise ValueError("No file provided")

        if not self.is_allowed_file(file_storage.filename):
            allowed_str = ', '.join(current_app.config.get('ALLOWED_EXTENSIONS', {'pdf', 'docx', 'doc'}))
            raise ValueError(f"Unsupported file extension. Allowed extensions: {allowed_str}")

        clean_name = secure_filename(file_storage.filename)
        unique_name = f"{uuid.uuid4().hex}_{clean_name}"
        
        target_dir = os.path.join(self.base_folder)
        os.makedirs(target_dir, exist_ok=True)
        
        full_path = os.path.join(target_dir, unique_name)
        file_storage.save(full_path)
        
        # Relative URL for serving via API
        return f"/api/v1/uploads/resumes/{unique_name}"

    def delete_file(self, file_url: str) -> bool:
        try:
            if not file_url:
                return False
            filename = os.path.basename(file_url)
            full_path = os.path.join(self.base_folder, filename)
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
            return False
        except Exception:
            return False

class S3FileStorage(BaseFileStorage):
    """S3-compatible bucket adapter stub for Production / Milestone 6"""
    def __init__(self, bucket_name: str = None):
        self.bucket_name = bucket_name

    def save_file(self, file_storage, subfolder: str = 'resumes') -> str:
        raise NotImplementedError("S3 storage adapter is enabled for production deployment")

    def delete_file(self, file_path: str) -> bool:
        raise NotImplementedError("S3 storage adapter is enabled for production deployment")

def get_storage_service() -> BaseFileStorage:
    # Switch to S3FileStorage if AWS_S3_BUCKET is set in environment
    if os.getenv('AWS_S3_BUCKET'):
        return S3FileStorage(os.getenv('AWS_S3_BUCKET'))
    return LocalFileStorage()
