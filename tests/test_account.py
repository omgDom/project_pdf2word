import unittest
from flask import url_for
from app import create_app, db
from app.models.user import User, APIKey
from werkzeug.security import generate_password_hash

class AccountTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Create test user
        self.test_user = User(
            name='Test User',
            email='test@example.com'
        )
        self.test_user.set_password('password123')
        db.session.add(self.test_user)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def login(self):
        return self.client.post('/login', data={
            'email': 'test@example.com',
            'password': 'password123'
        }, follow_redirects=True)

    def test_account_access(self):
        # Without login
        response = self.client.get('/account')
        self.assertEqual(response.status_code, 302)  # Should redirect to login

        # With login
        self.login()
        response = self.client.get('/account')
        self.assertEqual(response.status_code, 200)

    def test_update_profile(self):
        self.login()
        response = self.client.post('/account/update', 
            json={
                'name': 'Updated Name',
                'email': 'updated@example.com',
                'timezone': 'UTC'
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.test_user.name, 'Updated Name')

    def test_password_update(self):
        self.login()
        response = self.client.post('/account/password',
            json={
                'current_password': 'password123',
                'new_password': 'newpassword123'
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.test_user.check_password('newpassword123'))

    def test_api_key_generation(self):
        self.login()
        response = self.client.post('/account/api-key')
        self.assertEqual(response.status_code, 200)
        self.assertTrue('key' in response.json)
        
        # Verify key was saved to database
        api_key = APIKey.query.filter_by(user_id=self.test_user.id).first()
        self.assertIsNotNone(api_key) 