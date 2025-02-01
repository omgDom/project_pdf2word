from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from config import config  # Changed to import config dictionary
from datetime import datetime
import os

db = SQLAlchemy()
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    from app.models.user import User
    return User.query.get(int(user_id))

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])  # Use config dictionary
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'main.signin'
    
    # Create uploads directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize the app
    config[config_name].init_app(app)
    
    # Register blueprints
    from .routes.main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    # Register other blueprints if needed
    from .routes.api import api as api_blueprint
    app.register_blueprint(api_blueprint)
    
    from .routes.gmail import gmail as gmail_blueprint
    app.register_blueprint(gmail_blueprint)
    
    # Register additional blueprints
    from .routes.account import account
    app.register_blueprint(account)
    
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
