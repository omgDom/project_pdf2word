import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.ERROR)

# Silence specific loggers
for logger_name in ['matplotlib', 'PIL', 'werkzeug']:
    logging.getLogger(logger_name).setLevel(logging.ERROR)

# Import and create app
from app import create_app
app = create_app()

if __name__ == '__main__':
    print("Starting Flask application...")
    print("Access the dashboard at: http://127.0.0.1:5000")
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    )
