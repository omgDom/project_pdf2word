from flask import Blueprint, request, jsonify, current_app
import os
from werkzeug.utils import secure_filename
import uuid

api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/convert', methods=['GET', 'POST'])
def convert_file():
    print(f"Convert endpoint hit with method: {request.method}")  # Debug print
    
    # Handle GET request (for testing)
    if request.method == 'GET':
        return jsonify({
            'message': 'Convert endpoint is working',
            'usage': 'Please use POST method with file and format parameters'
        })
    
    # Handle POST request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    target_format = request.form.get('format', 'pdf')
    
    print(f"Received file: {file.filename}, target format: {target_format}")  # Debug print
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # For testing, just return success
        return jsonify({
            'success': True,
            'downloadUrl': f"/download/test.{target_format}",
            'originalName': file.filename,
            'convertedFormat': target_format
        })
        
    except Exception as e:
        print("Conversion error:", str(e))  # Log the error
        return jsonify({'error': str(e)}), 500 