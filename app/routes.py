from flask import Blueprint, render_template, request, send_file, current_app, redirect, url_for, flash, session
import os
from werkzeug.utils import secure_filename
from deep_translator import GoogleTranslator
import docx
from pdf2docx import Converter as PDFConverter
import tempfile
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import simpleSplit
from functools import wraps

main = Blueprint('main', __name__)

def premium_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_premium'):
            flash('This feature requires a premium subscription', 'premium')
            return redirect(url_for('main.pricing'))
        return f(*args, **kwargs)
    return decorated_function

@main.route('/')
def index():
    """Route for the main PDF converter page"""
    try:
        translations = {
            'title': 'PDF to Word Converter',
            'security_title': 'Security Information',
            'security_info': [
                'Your files are encrypted during transfer',
                'Files are automatically deleted after conversion',
                'No data is stored on our servers'
            ]
        }
        
        return render_template('index.html',
            lang='en',
            translations=translations
        )
    except Exception as e:
        current_app.logger.error(f"Error rendering index: {str(e)}")
        return f"An error occurred: {str(e)}", 500

@main.route('/translate')
@premium_required
def translate_page():
    """Route for the document translator page"""
    try:
        # Add debug logging
        current_app.logger.debug(f"Session premium status: {session.get('is_premium')}")
        
        # Extended language list
        languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'sv': 'Swedish'
        }
        
        return render_template('translate.html',
            languages=languages,
            translations={
                'title': 'Document Translator',
                'description': 'Translate your documents between languages',
                'upload_text': 'Drag & drop your document here or click to browse',
                'supported_formats': 'Supported formats: PDF, DOCX, TXT'
            }
        )
    except Exception as e:
        current_app.logger.error(f"Error rendering translate page: {str(e)}")
        return f"An error occurred: {str(e)}", 500

@main.route('/translate/convert', methods=['POST'])
def translate_document():
    try:
        if 'file' not in request.files:
            return 'No file uploaded', 400
        
        file = request.files['file']
        source_lang = request.form.get('source_lang', 'auto')
        target_lang = request.form.get('target_lang', 'en')
        
        if file.filename == '':
            return 'No file selected', 400
            
        # Create temp directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save the uploaded file
            filename = secure_filename(file.filename)
            input_path = os.path.join(temp_dir, filename)
            file.save(input_path)
            
            # Extract text based on file type
            text_content = ''
            file_extension = Path(filename).suffix.lower()
            
            if file_extension == '.txt':
                with open(input_path, 'r', encoding='utf-8') as f:
                    text_content = f.read()
                    
            elif file_extension == '.docx':
                doc = docx.Document(input_path)
                text_content = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
                
            elif file_extension == '.pdf':
                # Convert PDF to DOCX first
                temp_docx = os.path.join(temp_dir, 'temp.docx')
                cv = PDFConverter(input_path)
                cv.convert(temp_docx)
                cv.close()
                
                # Extract text from DOCX
                doc = docx.Document(temp_docx)
                text_content = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
            
            # Translate the content
            try:
                translator = GoogleTranslator(source=source_lang, target=target_lang)
                translated_text = translator.translate(text_content)
            except Exception as e:
                current_app.logger.error(f"Translation error: {str(e)}")
                return f"Translation failed: {str(e)}", 500
            
            # Create output file based on format
            if file_extension == '.pdf':
                final_output = os.path.join(temp_dir, f'translated_{filename}')
                try:
                    # Create PDF with ReportLab
                    c = canvas.Canvas(final_output, pagesize=letter)
                    width, height = letter
                    
                    # Use built-in Helvetica font
                    c.setFont('Helvetica', 12)
                    
                    # Add title
                    c.setFont('Helvetica-Bold', 16)
                    title = f"Translated Document ({source_lang} → {target_lang})"
                    c.drawString(50, height - 40, title)
                    
                    # Reset font for body text
                    c.setFont('Helvetica', 12)
                    
                    # Split text into lines and pages
                    y = height - 80  # Start below title
                    for paragraph in translated_text.split('\n'):
                        if paragraph.strip():
                            # Wrap long lines
                            lines = simpleSplit(paragraph, 'Helvetica', 12, width - 100)
                            for line in lines:
                                if y < 50:  # New page if near bottom
                                    c.showPage()
                                    c.setFont('Helvetica', 12)
                                    y = height - 50
                                try:
                                    c.drawString(50, y, line)
                                except:
                                    # If there's an encoding issue, try to clean the text
                                    cleaned_line = ''.join(char for char in line if ord(char) < 128)
                                    c.drawString(50, y, cleaned_line)
                                y -= 20  # Line spacing
                            y -= 10  # Paragraph spacing
                    
                    # Add page numbers
                    page_num = c.getPageNumber()
                    c.drawString(width/2, 30, f"Page {page_num}")
                    
                    c.save()
                except Exception as e:
                    current_app.logger.error(f"PDF creation error: {str(e)}")
                    return f"Error creating PDF: {str(e)}", 500
                    
            elif file_extension == '.docx':
                final_output = os.path.join(temp_dir, f'translated_{filename}')
                doc = docx.Document()
                for paragraph in translated_text.split('\n'):
                    if paragraph.strip():
                        doc.add_paragraph(paragraph)
                doc.save(final_output)
                
            else:  # .txt
                final_output = os.path.join(temp_dir, f'translated_{filename}')
                with open(final_output, 'w', encoding='utf-8') as f:
                    f.write(translated_text)
            
            # Send the file
            try:
                return send_file(
                    final_output,
                    as_attachment=True,
                    download_name=f'translated_{filename}',
                    mimetype='application/pdf' if file_extension == '.pdf' else None
                )
            except Exception as e:
                current_app.logger.error(f"Error sending file: {str(e)}")
                return f"Error sending file: {str(e)}", 500
                
    except Exception as e:
        current_app.logger.error(f"Translation error: {str(e)}")
        return f"Translation failed: {str(e)}", 500

@main.route('/convert', methods=['POST'])
def convert():
    try:
        if 'file' not in request.files:
            current_app.logger.error('No file in request')
            return 'No file uploaded', 400
        
        file = request.files['file']
        if file.filename == '':
            current_app.logger.error('No file selected')
            return 'No file selected', 400
            
        if file and file.filename.endswith('.pdf'):
            # Save uploaded PDF
            filename = secure_filename(file.filename)
            pdf_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(pdf_path)
            
            try:
                # Convert PDF to DOCX
                docx_path = pdf_path.replace('.pdf', '.docx')
                cv = PDFConverter(pdf_path)
                cv.convert(docx_path)
                cv.close()
                
                # Send the converted file
                return send_file(
                    docx_path,
                    as_attachment=True,
                    download_name=filename.replace('.pdf', '.docx'),
                    mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                )
            finally:
                # Clean up files
                try:
                    if os.path.exists(pdf_path):
                        os.remove(pdf_path)
                    if os.path.exists(docx_path):
                        os.remove(docx_path)
                except Exception as e:
                    current_app.logger.error(f'Error cleaning up files: {str(e)}')
                    
    except Exception as e:
        current_app.logger.error(f'Conversion error: {str(e)}')
        return f'Conversion failed: {str(e)}', 500

@main.route('/features')
def features():
    return render_template('features.html', title='Features')

@main.route('/pricing')
def pricing():
    return render_template('pricing.html', title='Pricing')

@main.route('/signin')
def signin():
    return render_template('signin.html', title='Sign In')

@main.route('/signup')
def signup():
    return render_template('signup.html', title='Sign Up')
