from flask import Flask
from flask_login import LoginManager, current_user
from config import Config
from .routes.routes import main
from datetime import datetime
import os
from .models import User  # Import the User model

# Initialize Flask-Login
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    # This is a simple implementation - replace with database lookup in production
    return User(user_id)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize Flask-Login
    login_manager.init_app(app)
    login_manager.login_view = 'main.signin'
    
    # Create uploads directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize the app
    config_class.init_app(app)
    
    # Register blueprints
    app.register_blueprint(main)
    
    # Add template context processor
    @app.context_processor
    def utility_processor():
        return {
            'now': datetime.utcnow,
            'current_year': datetime.utcnow().year,
            'current_user': current_user  # Add current_user to all templates
        }
    
    return app

# Make create_app available for import
__all__ = ['create_app']
