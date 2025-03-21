from flask import Blueprint, render_template, abort, request, redirect, url_for, flash, current_app
from flask_login import login_required, current_user
from app.models.user import User
from app import db
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func
from app.services.email import send_verification_email  # Add this import
from app.models.activity_log import ActivityLog

admin = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Please sign in first.')  # Add a message for better UX
            return redirect(url_for('main.index'))  # Redirect to home where modal can be shown
        if not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)
    return decorated_function

@admin.route('/test')
def admin_test():
    print("Accessing admin test route")  # Debug print
    return "Admin test route working"

@admin.route('/dashboard')
@login_required
def admin_dashboard():
    print(f"Dashboard access - User: {current_user.email}")  # Debug print
    print(f"Is authenticated: {current_user.is_authenticated}")  # Debug print
    print(f"Is admin: {current_user.is_admin}")  # Debug print
    
    if not current_user.is_admin:
        flash('Admin access required')
        return redirect(url_for('main.index'))
        
    users = User.query.all()
    return render_template('admin/admin_dashboard.html', users=users)

@admin.route('/users')
@login_required
def manage_users():
    if not current_user.is_admin:
        abort(403)
    
    search_query = request.args.get('q', '').strip()
    
    if search_query:
        users = User.query.filter(
            db.or_(
                User.name.ilike(f'%{search_query}%'),
                User.email.ilike(f'%{search_query}%')
            )
        ).all()
    else:
        users = User.query.all()
    
    return render_template('admin/users.html', users=users)

@admin.route('/users/<int:user_id>/delete', methods=['POST'])
@login_required
def delete_user(user_id):
    if not current_user.is_admin:
        abort(403)
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash('Cannot delete your own account')
        return redirect(url_for('admin.manage_users'))
    
    log_activity(
        current_user.id,
        'delete_user',
        f'Deleted user {user.email}'
    )
    
    db.session.delete(user)
    db.session.commit()
    flash('User deleted successfully')
    return redirect(url_for('admin.manage_users'))

@admin.route('/users/<int:user_id>/verify', methods=['POST'])
@login_required
def verify_user_email(user_id):
    if not current_user.is_admin:
        abort(403)
    
    user = User.query.get_or_404(user_id)
    user.email_verified = True
    db.session.commit()
    flash(f'Email verified for {user.email}')
    return redirect(url_for('admin.manage_users'))

@admin.route('/users/<int:user_id>/resend-verification', methods=['POST'])
@login_required
def resend_verification(user_id):
    print(f"Starting resend_verification for user_id: {user_id}")  # Debug print
    
    if not current_user.is_admin:
        print("Access denied: User is not admin")  # Debug print
        abort(403)
    
    user = User.query.get_or_404(user_id)
    print(f"Found user: {user.email}")  # Debug print
    
    try:
        # Generate new verification token
        token = user.generate_verification_token()
        print(f"Generated new token for user")  # Debug print
        
        # Send verification email
        if send_verification_email(user):
            print("Verification email sent successfully")  # Debug print
            flash(f'Verification email sent to {user.email}', 'success')
        else:
            print("Failed to send verification email")  # Debug print
            flash('Failed to send verification email', 'error')
            
    except Exception as e:
        print(f"Error in resend_verification: {str(e)}")  # Debug print
        flash(f'Error sending verification email: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_users'))

@admin.route('/users/<int:user_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
    if not current_user.is_admin:
        abort(403)
    
    user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        user.name = request.form.get('name', user.name)
        user.email = request.form.get('email', user.email)
        user.email_verified = 'email_verified' in request.form
        user.is_admin = 'is_admin' in request.form
        
        try:
            db.session.commit()
            flash('User updated successfully')
            return redirect(url_for('admin.manage_users'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating user: {str(e)}')
    
    return render_template('admin/edit_user.html', user=user)

@admin.route('/stats')
@login_required
def admin_stats():
    if not current_user.is_admin:
        abort(403)
        
    # Get user statistics
    total_users = User.query.count()
    verified_users = User.query.filter_by(email_verified=True).count()
    admin_users = User.query.filter_by(is_admin=True).count()
    
    # Get new users in last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users = User.query.filter(User.created_at >= week_ago).count()
    
    return render_template('admin/stats.html',
        total_users=total_users,
        verified_users=verified_users,
        admin_users=admin_users,
        new_users=new_users
    )

@admin.route('/search')
@login_required
def search_users():
    if not current_user.is_admin:
        abort(403)
        
    query = request.args.get('q', '')
    users = []
    if query:
        users = User.query.filter(
            (User.name.ilike(f'%{query}%')) |
            (User.email.ilike(f'%{query}%'))
        ).all()
    
    return render_template('admin/search.html', users=users, query=query)

@admin.route('/activity')
@login_required
def activity_logs():
    if not current_user.is_admin:
        abort(403)
    
    page = request.args.get('page', 1, type=int)
    per_page = 50
    
    logs = ActivityLog.query\
        .order_by(ActivityLog.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return render_template('admin/activity.html', logs=logs)

@admin.route('/hello')
def hello():
    return "Hello from admin blueprint!"

@admin.route('/whoami')
def whoami():
    print("Accessing whoami")  # Debug print
    if current_user.is_authenticated:
        print(f"User is authenticated: {current_user.email}")
        print(f"Is admin: {current_user.is_admin}")
        return f"Logged in as {current_user.email} (Admin: {current_user.is_admin})"
    else:
        print("User is not authenticated")
        return "Not logged in"

def log_activity(user_id, action, description):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        description=description,
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()