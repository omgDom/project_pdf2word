from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from ..models.user import User
from ..models.api_key import APIKey
from ..services.converter import DocumentConverter
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime, timedelta
from flask_login import login_required, current_user
from ..extensions import db

business_api = Blueprint('business_api', __name__)

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key is required'}), 401
            
        # Verify API key
        key = APIKey.query.filter_by(key=api_key, is_active=True).first()
        if not key:
            return jsonify({'error': 'Invalid API key'}), 401
            
        # Check rate limits
        if key.is_rate_limited():
            return jsonify({'error': 'Rate limit exceeded'}), 429
            
        # Track API usage
        key.log_request()
        
        return f(*args, **kwargs)
    return decorated_function

@business_api.route('/api/v1/convert', methods=['POST'])
@require_api_key
def convert_document():
    """
    Convert a document using the API
    ---
    parameters:
      - name: file
        in: formData
        type: file
        required: true
        description: The PDF file to convert
      - name: output_format
        in: formData
        type: string
        required: false
        default: docx
        description: Desired output format (docx, txt)
      - name: options
        in: formData
        type: object
        required: false
        description: Additional conversion options
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if not file.filename:
            return jsonify({'error': 'No file selected'}), 400
            
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are supported'}), 400
            
        # Generate secure filename and paths
        filename = secure_filename(file.filename)
        temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(uuid.uuid4()))
        os.makedirs(temp_dir, exist_ok=True)
        
        input_path = os.path.join(temp_dir, filename)
        output_filename = os.path.splitext(filename)[0] + '.docx'
        output_path = os.path.join(temp_dir, output_filename)
        
        # Save uploaded file
        file.save(input_path)
        
        # Get conversion options
        options = request.form.get('options', '{}')
        try:
            options = json.loads(options)
        except:
            options = {}
            
        # Initialize converter with options
        converter = DocumentConverter()
        
        # Perform conversion
        result = converter.convert(input_path, output_path)
        
        if not result or not os.path.exists(output_path):
            return jsonify({'error': 'Conversion failed'}), 500
            
        # Return download URL or file content based on configuration
        download_url = f"https://{current_app.config['SERVER_NAME']}/api/v1/download/{os.path.basename(temp_dir)}/{output_filename}"
        
        return jsonify({
            'success': True,
            'download_url': download_url,
            'filename': output_filename,
            'expires_in': 3600  # URL expires in 1 hour
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
    finally:
        # Cleanup will be handled by a background task
        pass

@business_api.route('/api/v1/download/<token>/<filename>')
@require_api_key
def download_file(token, filename):
    """Download a converted file"""
    try:
        # Validate token and filename
        temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], token)
        file_path = os.path.join(temp_dir, secure_filename(filename))
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
            
        # Stream the file
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@business_api.route('/api/v1/batch/convert', methods=['POST'])
@require_api_key
def batch_convert():
    """
    Convert multiple documents in a single request
    ---
    parameters:
      - name: files[]
        in: formData
        type: array
        items:
          type: file
        required: true
        description: Array of PDF files to convert
      - name: options
        in: formData
        type: object
        required: false
        description: Conversion options
    """
    try:
        if 'files[]' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
            
        files = request.files.getlist('files[]')
        if not files:
            return jsonify({'error': 'No files selected'}), 400
            
        # Process each file
        results = []
        for file in files:
            # Similar conversion logic as single file endpoint
            # but collect results for batch response
            pass
            
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@business_api.route('/api/v1/status', methods=['GET'])
@require_api_key
def api_status():
    """Get API status and usage information"""
    try:
        api_key = request.headers.get('X-API-Key')
        key = APIKey.query.filter_by(key=api_key).first()
        
        return jsonify({
            'status': 'healthy',
            'rate_limit': {
                'limit': key.rate_limit,
                'remaining': key.remaining_requests,
                'reset': key.rate_limit_reset.isoformat() if key.rate_limit_reset else None
            },
            'usage': {
                'today': key.requests_today,
                'total': key.total_requests
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@business_api.route('/api/v1/keys/generate', methods=['POST'])
@login_required
def generate_key():
    """Generate a new API key for the user"""
    try:
        name = request.form.get('name')
        rate_limit = int(request.form.get('rate_limit', 1000))
        
        # Create new API key
        api_key = APIKey(
            user_id=current_user.id,
            name=name,
            rate_limit=rate_limit
        )
        
        db.session.add(api_key)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API key generated successfully',
            'key': api_key.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@business_api.route('/api/v1/keys/<int:key_id>/revoke', methods=['POST'])
@login_required
def revoke_key(key_id):
    """Revoke an API key"""
    try:
        api_key = APIKey.query.filter_by(
            id=key_id,
            user_id=current_user.id
        ).first()
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key not found'
            }), 404
        
        db.session.delete(api_key)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API key revoked successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@business_api.route('/api/v1/keys/<int:key_id>/deactivate', methods=['POST'])
@login_required
def deactivate_key(key_id):
    """Temporarily deactivate an API key"""
    try:
        api_key = APIKey.query.filter_by(
            id=key_id,
            user_id=current_user.id
        ).first()
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key not found'
            }), 404
        
        api_key.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API key deactivated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@business_api.route('/api/v1/keys/<int:key_id>/activate', methods=['POST'])
@login_required
def activate_key(key_id):
    """Reactivate a deactivated API key"""
    try:
        api_key = APIKey.query.filter_by(
            id=key_id,
            user_id=current_user.id
        ).first()
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key not found'
            }), 404
        
        api_key.is_active = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API key activated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@business_api.route('/api/v1/keys', methods=['GET'])
@login_required
def list_keys():
    """List all API keys for the current user"""
    try:
        api_keys = APIKey.query.filter_by(user_id=current_user.id).all()
        return jsonify({
            'success': True,
            'keys': [key.to_dict() for key in api_keys]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 