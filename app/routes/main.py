from flask import Blueprint, render_template, request, send_file, current_app, jsonify, redirect, url_for, flash
from flask_login import login_required, logout_user, current_user, login_user
import os
from werkzeug.utils import secure_filename
import uuid
from ..services.converter import DocumentConverter
from datetime import datetime
from ..extensions import db
from ..models.user import User
from ..models.api_key import APIKey
import re
from ..services.email import send_verification_email

# Create blueprint
main = Blueprint('main', __name__)

# Then use it in routes
@main.route('/')
def index():
    return render_template('index.html')

@main.route('/features')
def features():
    return render_template('features.html')

@main.route('/pricing')
def pricing():
    return render_template('pricing.html')

@main.route('/about')
def about():
    return render_template('about.html')

def validate_password(password):
    """
    Password must:
    - Be at least 8 characters long
    - Contain at least one uppercase letter
    - Contain at least one lowercase letter
    - Contain at least one number
    - Contain at least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
        
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
        
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
        
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
        
    if not re.search(r"[ !@#$%&'()*+,-./[\\\]^_`{|}~"+r'"]', password):
        return False, "Password must contain at least one special character"
        
    return True, "Password is valid"

@main.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('account.profile'))
        
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered')
            return redirect(url_for('main.signup'))
        
        user = User(name=name, email=email)
        user.set_password(password)
        user.generate_verification_token()
        
        try:
            db.session.add(user)
            db.session.commit()
            
            # Send verification email with error handling
            if send_verification_email(user):
                flash('Please check your email to verify your account')
            else:
                flash('Account created but verification email failed to send. Contact support.')
            
            return redirect(url_for('main.signin'))
            
        except Exception as e:
            print(f"Error during signup: {e}")  # Debug print
            db.session.rollback()
            flash('Error creating account')
            return redirect(url_for('main.signup'))
    
    return render_template('signup.html')

@main.route('/verify-email/<token>')
def verify_email(token):
    if current_user.is_authenticated and current_user.verify_email(token):
        db.session.commit()
        flash('Your email has been verified!')
    else:
        flash('The verification link is invalid or has expired.')
    return redirect(url_for('account.profile'))

@main.route('/privacy')
def privacy():
    metadata = {
        'last_updated': "April 2024",
        'title': 'Privacy Notice | SimpleDoc',
        'meta_description': 'Learn about SimpleDoc\'s privacy practices, data collection, and your rights regarding your personal information.',
        'canonical_url': request.url,
        'og_type': 'website',
        'twitter_card': 'summary',
        'keywords': 'privacy policy, data protection, privacy notice, SimpleDoc privacy, document privacy, data security'
    }
    return render_template('privacy.html', **metadata)

@main.route('/terms')
def terms():
    return render_template('terms.html')

@main.route('/cookies')
def cookies():
    return render_template('cookies.html')

@main.route('/profile')
@login_required
def profile():
    return render_template('account.html')

@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

@main.route('/download/<filename>')
def download_file(filename):
    try:
        # Secure the filename
        filename = secure_filename(filename)
        
        # Path to converted files
        converted_folder = os.path.join(current_app.root_path, 'temp', 'converted')
        
        # Send the file
        return send_file(
            os.path.join(converted_folder, filename),
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return str(e), 404 

@main.route('/integrations')
def integrations():
    """Render the integrations page"""
    return render_template('integrations.html')

@main.route('/api-docs')
def api_docs():
    """Render the API documentation page"""
    return render_template('api_docs.html')

@main.route('/api-dashboard')
@login_required
def api_dashboard():
    """Render the API management dashboard"""
    api_keys = APIKey.query.filter_by(user_id=current_user.id).all()
    return render_template('api_dashboard.html', api_keys=api_keys) 