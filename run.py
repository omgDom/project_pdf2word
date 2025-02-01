from app import create_app, db
import os

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # For development only

app = create_app()

# Create tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5002)
