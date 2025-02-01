import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # Base configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'app', 'uploads')

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
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

# Create upload folder if it doesn't exist
def init_app(app):
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {
    'pdf', 'docx', 'txt', 'rtf', 'xlsx', 
    'pptx', 'epub', 'html', 'md', 'odt', 'jpeg'
} 