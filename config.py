import os

class Config:
    # Base directory of the project
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    # Essential Flask configs
    SECRET_KEY = 'dev'  # Change this in production
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'app', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Cloud service configs (optional)
    DROPBOX_APP_KEY = os.environ.get('DROPBOX_APP_KEY')
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

    # Create upload folder if it doesn't exist
    @staticmethod
    def init_app(app):
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True) 

    ALLOWED_EXTENSIONS = {'pdf'} 