from flask import Blueprint, redirect, url_for, session, request, render_template, current_app
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from werkzeug.exceptions import BadRequest as BadRequestError
import os
from dotenv import load_dotenv

gmail = Blueprint('gmail', __name__)

# Load environment variables
load_dotenv()

# OAuth 2.0 configuration
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose'
]

def get_client_secrets_file():
    """Get the client secrets file path from environment"""
    secrets_file = os.getenv('GOOGLE_CLIENT_SECRETS_FILE')
    if not secrets_file or not os.path.exists(secrets_file):
        raise BadRequestError('Gmail integration not properly configured')
    return secrets_file

def get_redirect_uri():
    """Get the appropriate redirect URI based on environment"""
    if os.environ.get('FLASK_ENV') == 'development':
        return 'http://127.0.0.1:5000/oauth2callback'
    return os.getenv('GOOGLE_OAUTH_REDIRECT_URI', 'https://simpledoc.io/oauth2callback')

@gmail.route('/integration')
def integration():
    """Show Gmail integration page"""
    error = request.args.get('error')
    return render_template('gmail/integration.html', error=error)

@gmail.route('/connect-gmail')
def connect_gmail():
    """Initiate Gmail connection flow"""
    try:
        # Create OAuth2 flow instance
        flow = Flow.from_client_secrets_file(
            get_client_secrets_file(),
            scopes=SCOPES,
            redirect_uri=get_redirect_uri()
        )
        
        # Generate authorization URL
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        # Store state for later verification
        session['state'] = state
        
        return redirect(authorization_url)
        
    except Exception as e:
        current_app.logger.error(f"Gmail connection error: {str(e)}")
        return redirect(url_for('gmail.integration', error="Gmail connection failed"))

@gmail.route('/oauth2callback')
def oauth2callback():
    """Handle the OAuth 2.0 callback from Google"""
    try:
        if 'state' not in session:
            raise BadRequestError('Invalid state parameter')

        # Get flow instance
        flow = Flow.from_client_secrets_file(
            get_client_secrets_file(),
            scopes=SCOPES,
            state=session['state']
        )
        
        # Use the authorization server's response to fetch the OAuth 2.0 tokens
        flow.redirect_uri = get_redirect_uri()
        authorization_response = request.url
        flow.fetch_token(authorization_response=authorization_response)
        
        # Store credentials in session
        credentials = flow.credentials
        session['gmail_credentials'] = credentials_to_dict(credentials)
        
        return redirect(url_for('gmail.dashboard'))
        
    except Exception as e:
        current_app.logger.error(f"Gmail OAuth callback error: {str(e)}")
        return redirect(url_for('gmail.integration', error="Failed to complete authentication"))

@gmail.route('/dashboard')
def dashboard():
    """Show Gmail integration dashboard"""
    if 'gmail_credentials' not in session:
        return redirect(url_for('gmail.integration'))
    
    try:
        credentials = Credentials(**session['gmail_credentials'])
        service = build('gmail', 'v1', credentials=credentials)
        
        # Get user profile
        profile = service.users().getProfile(userId='me').execute()
        
        # Get attachment settings from environment
        attachment_settings = {
            'allowed_types': os.getenv('GMAIL_ATTACHMENT_TYPES', 'pdf,doc,docx').split(','),
            'max_size': int(os.getenv('GMAIL_MAX_ATTACHMENT_SIZE', 10485760))
        }
        
        return render_template(
            'gmail/dashboard.html',
            profile=profile,
            settings=attachment_settings
        )
        
    except Exception as e:
        current_app.logger.error(f"Gmail dashboard error: {str(e)}")
        session.pop('gmail_credentials', None)
        return redirect(url_for('gmail.integration', error="Connection expired"))

def credentials_to_dict(credentials):
    """Convert credentials to dictionary for session storage"""
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    } 