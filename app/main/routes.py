from flask import render_template, current_app
from . import main

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/features')
def features():
    return render_template('features.html')

@main.route('/pricing')
def pricing():
    return render_template('pricing.html')

@main.route('/signin')
def signin():
    return render_template('signin.html')

@main.route('/signup')
def signup():
    return render_template('signup.html')

@main.route('/about')
def about():
    return render_template('about.html')

@main.route('/privacy')
def privacy():
    return render_template('privacy.html')

@main.route('/terms')
def terms():
    return render_template('terms.html')

@main.route('/contact')
def contact():
    return render_template('contact.html')

@main.route('/cookies')
def cookies():
    return render_template('cookies.html')

@main.route('/translate')
def translate_page():
    try:
        languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
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
