from flask import Flask
from datetime import datetime

# Anonymous User class
class AnonymousUser:
    @property
    def is_authenticated(self):
        return False
    
    @property
    def is_premium(self):
        return False

def create_app():
    app = Flask(__name__)
    
    # Register blueprints
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    # Add context processors
    @app.context_processor
    def inject_now():
        return {
            'now': datetime.utcnow(),
            'current_user': AnonymousUser()
        }
    
    return app

# Make create_app available for import
__all__ = ['create_app']
