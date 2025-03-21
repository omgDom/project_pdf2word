import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # Base configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'app', 'uploads')
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = 'simpledoc.app@gmail.com'  # Your Gmail address
    MAIL_PASSWORD = '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'  # Your client secret
    MAIL_DEFAULT_SENDER = 'SimpleDoc <simpledoc.app@gmail.com>'
    MAIL_DEBUG = True

    # Add debug settings for email
    MAIL_SUPPRESS_SEND = False  # Make sure emails are actually sent

    # Base URL and OAuth configuration
    BASE_URL = os.environ.get('BASE_URL', 'http://127.0.0.1:5002')
    
    # OAuth callback URLs
    GOOGLE_CALLBACK_URL = f"{BASE_URL}/login/google/callback"
    GITHUB_CALLBACK_URL = f"{BASE_URL}/login/github/callback"
    
    # OAuth credentials
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID')
    GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET')

    @staticmethod
    def init_app(app):
        pass

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Use in-memory SQLite for tests
    WTF_CSRF_ENABLED = False  # Disable CSRF for testing
    SERVER_NAME = 'localhost.localdomain'

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Base directory of the project
BASE_DIR = basedir

# Essential Flask configs
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Cloud service configs (optional)
DROPBOX_APP_KEY = os.environ.get('DROPBOX_APP_KEY')
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

# Create upload folder if it doesn't exist
def init_app(app):
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {
    'pdf', 'docx', 'txt', 'rtf', 'xlsx', 
    'pptx', 'epub', 'html', 'md', 'odt', 'jpeg'
} 