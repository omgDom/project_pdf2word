from flask import Flask, send_file, current_app, request, jsonify
from werkzeug.utils import secure_filename
import os

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = 'your-secret-key'
    
    # Ensure the uploads directory exists
    uploads_dir = os.path.join(app.root_path, 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    # Set upload folder configuration
    app.config['UPLOAD_FOLDER'] = uploads_dir
    
    # Register blueprints
    from app.routes import main
    app.register_blueprint(main)
    
    # Debug route
    @app.route('/test')
    def test():
        return 'Flask app is working!'
    
    return app
