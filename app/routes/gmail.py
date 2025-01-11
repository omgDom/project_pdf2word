from flask import Blueprint, redirect, url_for, session, request, render_template
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os

gmail = Blueprint('gmail', __name__)

# OAuth 2.0 configuration
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose'
]

@gmail.route('/integration')
def integration():
    """Show Gmail integration page"""
    return render_template('gmail/integration.html')

@gmail.route('/connect-gmail')
def connect_gmail():
    """Initiate Gmail connection flow"""
    try:
        # Create OAuth2 flow instance
        flow = Flow.from_client_secrets_file(
            'client_secrets.json',
            scopes=SCOPES,
            redirect_uri=url_for('gmail.oauth2callback', _external=True)
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
        return redirect(url_for('gmail.integration', error="Gmail connection failed"))

@gmail.route('/oauth2callback')
def oauth2callback():
    """Handle OAuth2 callback from Google"""
    try:
        state = session['state']
        
        flow = Flow.from_client_secrets_file(
            'client_secrets.json',
            scopes=SCOPES,
            state=state,
            redirect_uri=url_for('gmail.oauth2callback', _external=True)
        )
        
        # Complete OAuth2 flow
        flow.fetch_token(authorization_response=request.url)
        
        # Store credentials
        credentials = flow.credentials
        
        # Store credentials in session
        session['gmail_credentials'] = credentials_to_dict(credentials)
        
        # Initialize Gmail API service
        service = build('gmail', 'v1', credentials=credentials)
        
        return redirect(url_for('gmail.dashboard'))
        
    except Exception as e:
        return redirect(url_for('gmail.integration', error="Gmail authentication failed"))

@gmail.route('/dashboard')
def dashboard():
    """Gmail integration dashboard"""
    if 'gmail_credentials' not in session:
        return redirect(url_for('gmail.connect_gmail'))
        
    try:
        credentials = Credentials(**session['gmail_credentials'])
        service = build('gmail', 'v1', credentials=credentials)
        
        # Get recent emails with attachments
        results = service.users().messages().list(
            userId='me',
            q='has:attachment'
        ).execute()
        
        messages = results.get('messages', [])
        recent_documents = []
        
        for message in messages[:5]:  # Get details for 5 most recent
            msg = service.users().messages().get(
                userId='me',
                id=message['id']
            ).execute()
            
            # Extract attachment info
            if 'payload' in msg and 'parts' in msg['payload']:
                for part in msg['payload']['parts']:
                    if part.get('filename'):
                        recent_documents.append({
                            'name': part['filename'],
                            'message_id': message['id'],
                            'attachment_id': part['body'].get('attachmentId')
                        })
        
        return render_template('gmail/dashboard.html', 
                             documents=recent_documents)
                             
    except Exception as e:
        return redirect(url_for('gmail.integration', error="Failed to load dashboard"))

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