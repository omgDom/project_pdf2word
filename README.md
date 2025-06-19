# SimpleDoc

Professional PDF to Word conversion service with advanced document analysis and processing capabilities.

## Features

- 🔄 PDF to Word conversion with layout preservation
- 📊 Advanced document analysis
- 🔒 Secure file handling
- 📧 Gmail integration for direct document processing
- 🔑 API access for business integration
- 🌙 Dark mode support
- 📱 Responsive design

## Tech Stack

- Python/Flask
- SQLAlchemy
- Google OAuth2
- Gmail API
- Custom document processing engine

## Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
flask db upgrade
```

5. Run the development server:
```bash
flask run
```

## Environment Variables

Required environment variables:
- `SECRET_KEY`: Flask secret key
- `DATABASE_URL`: Database connection string
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CLIENT_SECRETS_FILE`: Path to Google OAuth credentials file

## Development

The project follows a modular structure:
- `app/`: Main application package
  - `routes/`: Route blueprints
  - `models/`: Database models
  - `services/`: Business logic
  - `static/`: Static assets
  - `templates/`: Jinja2 templates

## License

MIT License - See [LICENSE](LICENSE) file for details

## Contact

For support or inquiries, visit [simpledoc.io](https://www.simpledoc.io)
