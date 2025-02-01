from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from app.models.user import User, APIKey
from app import db

account = Blueprint('account', __name__)

@account.route('/account')
@login_required
def profile():
    return render_template('account.html')

@account.route('/account/update', methods=['POST'])
@login_required
def update_profile():
    data = request.json
    try:
        current_user.name = data.get('name', current_user.name)
        current_user.email = data.get('email', current_user.email)
        current_user.timezone = data.get('timezone', current_user.timezone)
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@account.route('/account/password', methods=['POST'])
@login_required
def update_password():
    data = request.json
    if not current_user.check_password(data['current_password']):
        return jsonify({'status': 'error', 'message': 'Current password is incorrect'}), 400
    
    current_user.set_password(data['new_password'])
    db.session.commit()
    return jsonify({'status': 'success'})

@account.route('/account/api-key', methods=['POST'])
@login_required
def generate_api_key():
    import secrets
    key = secrets.token_urlsafe(32)
    api_key = APIKey(key=key, user_id=current_user.id)
    db.session.add(api_key)
    db.session.commit()
    return jsonify({'status': 'success', 'key': key}) 