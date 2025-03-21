# Set matplotlib configuration before any imports
import os
import sys
import logging
from datetime import datetime

# Configure logging first
logging.basicConfig(level=logging.ERROR)

# Silence specific loggers
for logger_name in [
    'matplotlib',
    'matplotlib.font_manager',
    'PIL',
    'werkzeug',
    'fontTools'
]:
    logging.getLogger(logger_name).setLevel(logging.ERROR)

# Now import matplotlib and set backend
import matplotlib
matplotlib.use('Agg', force=True)
matplotlib.set_loglevel('WARNING')

from flask import Flask
import json
from .extensions import db, login_manager, mail

logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    
    # Configure the app
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Production configurations
    if os.environ.get('FLASK_ENV') == 'production':
        app.config.update(
            SERVER_NAME='simpledoc.io',
            PREFERRED_URL_SCHEME='https',
            SESSION_COOKIE_SECURE=True,
            SESSION_COOKIE_HTTPONLY=True,
            SESSION_COOKIE_SAMESITE='Lax',
            REMEMBER_COOKIE_SECURE=True,
            REMEMBER_COOKIE_HTTPONLY=True
        )
        
    # Configure server name based on environment
    if os.environ.get('FLASK_ENV') == 'development':
        app.config['SERVER_NAME'] = '127.0.0.1:5000'
    else:
        app.config['SERVER_NAME'] = os.getenv('SERVER_NAME', 'simpledoc.io')
        
    @app.after_request
    def add_security_headers(response):
        """Add security headers to each response"""
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response
    
    # Add datetime functions to Jinja2 environment
    app.jinja_env.globals.update(
        now=datetime.now,
        datetime=datetime
    )
    
    # Add context processor for current year
    @app.context_processor
    def inject_now():
        return {
            'now': datetime.utcnow(),
            'domain': 'simpledoc.io'
        }
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    
    # Configure login manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info'
    
    # Get the absolute path to the app directory
    app_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create required directories with absolute paths
    directories = {
        'temp_uploads': os.path.join(app_dir, 'temp', 'uploads'),
        'temp_converted': os.path.join(app_dir, 'temp', 'converted'),
        'data': os.path.join(app_dir, 'data')
    }
    
    # Create directories silently
    for directory in directories.values():
        os.makedirs(directory, exist_ok=True)
    
    # Initialize the data file
    data_file = os.path.join(directories['data'], 'layout_patterns.json')
    if not os.path.exists(data_file):
        initial_data = {
            'layouts': {},
            'sections': {},
            'styles': {},
            'ratings': {},
            'metadata': {
                'total_analyzed': 0,
                'last_updated': None
            }
        }
        with open(data_file, 'w') as f:
            json.dump(initial_data, f, indent=2)
    
    with app.app_context():
        # Register blueprints
        from .routes.main import main
        from .routes.auth import auth
        from .routes.api import api
        from .routes.analytics import analytics
        from .routes.gmail import gmail
        from .routes.business_api import business_api
        
        app.register_blueprint(main)
        app.register_blueprint(api)
        app.register_blueprint(analytics)
        app.register_blueprint(auth)
        app.register_blueprint(gmail)
        app.register_blueprint(business_api)
        
        # Create database tables
        db.create_all()
    
    return app

def init_app():
    """Initialize the application"""
    app = create_app()
    return app

# Make create_app available for import
__all__ = ['create_app']
