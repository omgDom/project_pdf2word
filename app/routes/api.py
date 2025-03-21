from flask import Blueprint, request, jsonify, current_app, send_file
import os
from werkzeug.utils import secure_filename
import uuid
from ..services.converter import DocumentConverter, SmartDocumentConverter
import logging
from ..services.analysis.resume_analyzer import ResumeAnalyzer

logger = logging.getLogger(__name__)

api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    target_format = request.form.get('format', 'docx')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Initialize converter variable outside try block to avoid UnboundLocalError
    converter = None
    input_path = None
    
    try:
        # Create unique filename for both input and output
        input_filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
        output_filename = os.path.splitext(input_filename)[0] + '_converted.' + target_format
        
        # Create paths for temporary storage
        upload_folder = os.path.join(current_app.root_path, 'temp', 'uploads')
        output_folder = os.path.join(current_app.root_path, 'temp', 'converted')
        
        # Ensure directories exist
        os.makedirs(upload_folder, exist_ok=True)
        os.makedirs(output_folder, exist_ok=True)
        
        # Save uploaded file
        input_path = os.path.join(upload_folder, input_filename)
        output_path = os.path.join(output_folder, output_filename)
        file.save(input_path)
        
        # Use the simpler DocumentConverter for now since SmartDocumentConverter has issues
        converter = DocumentConverter()
        success = converter.convert(input_path, output_path, target_format)
        
        if not success:
            return jsonify({'error': 'Conversion failed'}), 500
        
        # Save the file to a permanent location for future reference
        permanent_upload_folder = os.path.join(current_app.root_path, 'uploads')
        os.makedirs(permanent_upload_folder, exist_ok=True)
        permanent_path = os.path.join(permanent_upload_folder, input_filename)
        
        # Only copy if we need to keep the original
        # import shutil
        # shutil.copy2(input_path, permanent_path)
        
        return jsonify({
            'success': True,
            'downloadUrl': f"/download/{output_filename}",
            'originalName': file.filename,
            'convertedFormat': target_format
        })
        
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        # Clean up resources if converter was initialized
        if converter and hasattr(converter, 'reset_state'):
            converter.reset_state()
        
        # Clean up input file
        if input_path and os.path.exists(input_path):
            try:
                os.remove(input_path)
            except Exception as e:
                logger.warning(f"Failed to remove input file: {str(e)}") 