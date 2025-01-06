from flask import Blueprint, render_template, request, send_file, current_app, jsonify
import os
from werkzeug.utils import secure_filename
import uuid
from ..services.converter import DocumentConverter

# Create blueprint
main = Blueprint('main', __name__)

# Basic page routes
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

@main.route('/signin')
def signin():
    return render_template('signin.html')

@main.route('/privacy')
def privacy():
    return render_template('privacy.html')

@main.route('/terms')
def terms():
    return render_template('terms.html')

@main.route('/cookies')
def cookies():
    return render_template('cookies.html')

@main.route('/legal')
def legal():
    return render_template('legal.html')

# File conversion routes
@main.route('/api/convert', methods=['GET', 'POST'])
def convert_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    target_format = request.form.get('format', 'pdf')
    
    print(f"Starting conversion process for {file.filename} to {target_format}")  # Debug log
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Create uploads directory if it doesn't exist
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        print(f"Upload folder: {upload_folder}")  # Debug log
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())
        input_filename = f"{unique_id}_{original_filename}"
        output_filename = f"{unique_id}_converted.{target_format}"
        
        # Get full paths
        input_path = os.path.join(upload_folder, input_filename)
        output_path = os.path.join(upload_folder, output_filename)
        print(f"Input path: {input_path}")  # Debug log
        print(f"Output path: {output_path}")  # Debug log
        
        # Save uploaded file
        file.save(input_path)
        print(f"File saved, size: {os.path.getsize(input_path)} bytes")  # Debug log
        
        # Convert the file
        print("Starting conversion...")  # Debug log
        converter = DocumentConverter()
        success = converter.convert(input_path, output_path, target_format)
        print(f"Conversion completed. Success: {success}")  # Debug log
        
        if success and os.path.exists(output_path):
            output_size = os.path.getsize(output_path)
            print(f"Output file created, size: {output_size} bytes")  # Debug log
            
            # Return success response with download URL
            return jsonify({
                'success': True,
                'downloadUrl': f"/download/{output_filename}",
                'originalName': original_filename,
                'convertedFormat': target_format
            })
        else:
            raise Exception("Conversion failed or output file not found")
            
    except Exception as e:
        print(f"Conversion error: {str(e)}")  # Error log
        import traceback
        print(traceback.format_exc())  # Full error traceback
        return jsonify({'error': str(e)}), 500

# Download route
@main.route('/download/<filename>')
def download_file(filename):
    try:
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        print(f"Attempting to download: {file_path}")  # Debug print
        
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")  # Debug print
            return jsonify({'error': 'File not found'}), 404
            
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        print(f"Download error: {str(e)}")  # Debug print
        return jsonify({'error': str(e)}), 500 