from flask import Blueprint, request, flash, redirect, url_for, current_app, render_template
from flask_login import login_user, logout_user, current_user, login_required
from app.models.user import User
from app import db
import requests
from urllib.parse import urlencode
import json
import logging

logger = logging.getLogger(__name__)
auth = Blueprint('auth', __name__)

@auth.route('/login')
def login():
    return render_template('auth/login.html')

@auth.route('/login/google')
def google_login():
    return render_template('auth/google_login.html')

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

@auth.route('/register')
def register():
    return render_template('auth/register.html')

@auth.route('/login', methods=['POST'])
def login_post():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    email = request.form.get('email')
    password = request.form.get('password')
    remember = request.form.get('remember', False)
    
    user = User.query.filter_by(email=email).first()
    
    if user and user.check_password(password):
        if not user.email_verified:
            flash('Please verify your email first.')
            return redirect(url_for('main.index'))
            
        login_user(user, remember=remember)
        next_page = request.args.get('next')
        return redirect(next_page or url_for('main.index'))
    
    flash('Invalid email or password')
    return redirect(url_for('main.index'))

@auth.route('/login/github')
def github_login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    # GitHub OAuth parameters
    params = {
        'client_id': current_app.config['GITHUB_CLIENT_ID'],
        'redirect_uri': url_for('auth.github_callback', _external=True),
        'scope': 'user:email'
    }
    
    # Redirect to GitHub's authorization page
    return redirect(f'https://github.com/login/oauth/authorize?{urlencode(params)}')

@auth.route('/login/github/callback')
def github_callback():
    # Get the authorization code
    code = request.args.get('code')
    if not code:
        flash('GitHub login failed')
        return redirect(url_for('main.index'))
    
    # Exchange code for access token
    response = requests.post(
        'https://github.com/login/oauth/access_token',
        data={
            'client_id': current_app.config['GITHUB_CLIENT_ID'],
            'client_secret': current_app.config['GITHUB_CLIENT_SECRET'],
            'code': code
        },
        headers={'Accept': 'application/json'}
    )
    
    # Get access token from response
    access_token = response.json().get('access_token')
    if not access_token:
        flash('GitHub login failed')
        return redirect(url_for('main.index'))
    
    # Get user info from GitHub
    github_user = requests.get(
        'https://api.github.com/user',
        headers={
            'Authorization': f'token {access_token}',
            'Accept': 'application/json'
        }
    ).json()
    
    # Get user's email
    emails = requests.get(
        'https://api.github.com/user/emails',
        headers={
            'Authorization': f'token {access_token}',
            'Accept': 'application/json'
        }
    ).json()
    
    primary_email = next(
        (email['email'] for email in emails if email['primary']),
        github_user.get('email')
    )
    
    if not primary_email:
        flash('Could not get email from GitHub')
        return redirect(url_for('main.index'))
    
    # Find or create user
    user = User.query.filter_by(email=primary_email).first()
    if not user:
        user = User(
            name=github_user.get('name') or github_user.get('login'),
            email=primary_email,
            email_verified=True  # GitHub emails are verified
        )
        db.session.add(user)
        db.session.commit()
    
    # Log in user
    login_user(user, remember=True)
    return redirect(url_for('main.index'))

@auth.route('/login/google/callback')
def google_callback():
    # Get the authorization code
    code = request.args.get('code')
    if not code:
        flash('Google login failed')
        return redirect(url_for('main.index'))
    
    # Exchange code for tokens
    token_response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'client_id': current_app.config['GOOGLE_CLIENT_ID'],
            'client_secret': current_app.config['GOOGLE_CLIENT_SECRET'],
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': url_for('auth.google_callback', _external=True)
        }
    )
    
    if not token_response.ok:
        flash('Failed to get Google token')
        return redirect(url_for('main.index'))
    
    tokens = token_response.json()
    
    # Get user info from Google
    user_response = requests.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {tokens["access_token"]}'}
    )
    
    if not user_response.ok:
        flash('Failed to get user info from Google')
        return redirect(url_for('main.index'))
    
    google_user = user_response.json()
    
    # Find or create user
    user = User.query.filter_by(email=google_user['email']).first()
    if not user:
        user = User(
            name=google_user.get('name', ''),
            email=google_user['email'],
            email_verified=google_user.get('verified_email', False),
            avatar=google_user.get('picture')
        )
        db.session.add(user)
        db.session.commit()
    
    # Log in user
    login_user(user, remember=True)
    return redirect(url_for('main.index')) 