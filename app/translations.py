TRANSLATIONS = {
    'en': {
        'title': 'PDF to Word Converter',
        'dropzone_text': 'Drag & Drop your PDF here or click to browse',
        'convert_button': 'Convert to Word',
        'converting': 'Converting...',
        'success': 'Conversion successful!',
        'security_title': 'Security Information',
        'security_info': [
            'Files are processed securely and deleted immediately after conversion',
            'Maximum file size: 16MB',
            'Supported format: PDF files only',
            'Your privacy is our priority'
        ],
        'error_no_file': 'No file selected',
        'error_invalid_type': 'Please select a PDF file',
        'error_file_size': 'File size exceeds maximum limit (16MB)',
    }
}

def get_translation(lang_code):
    return TRANSLATIONS.get(lang_code, TRANSLATIONS['en'])
