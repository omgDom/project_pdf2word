TRANSLATIONS = {
    'en': {
        'title': 'Document Converter',
        'dropzone_text': 'Drag & Drop your file here or click to browse',
        'convert_button': 'Convert',
        'converting': 'Converting...',
        'success': 'Conversion successful!',
        'security_title': 'Security Information',
        'security_info': [
            'Files are processed securely and deleted immediately after conversion',
            'Maximum file size: 16MB',
            'Supported formats: PDF, DOCX, TXT, RTF, XLSX, PPTX, EPUB, HTML, MD, ODT, JPEG',
            'Your privacy is our priority'
        ],
        'error_no_file': 'No file selected',
        'error_invalid_type': 'Please select a supported file type',
        'error_file_size': 'File size exceeds maximum limit (16MB)',
    }
}

def get_translation(lang_code):
    return TRANSLATIONS.get(lang_code, TRANSLATIONS['en'])
