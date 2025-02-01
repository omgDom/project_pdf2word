from flask import Blueprint, render_template, request, send_file, current_app, jsonify, redirect, url_for, flash
from flask_login import login_required, logout_user, current_user, login_user
import os
from werkzeug.utils import secure_filename
import uuid
from ..services.converter import DocumentConverter
from datetime import datetime
from app.models.user import User
from app import db

# Create blueprint first
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

@main.route('/signup')
def signup():
    return render_template('signup.html')

@main.route('/signin', methods=['GET', 'POST'])
def signin():
    if current_user.is_authenticated:
        return redirect(url_for('account.profile'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page if next_page else url_for('account.profile'))
            
        flash('Invalid email or password')
    return redirect(url_for('main.index'))

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