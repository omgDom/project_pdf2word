from flask_mail import Mail, Message
from flask import current_app, render_template, url_for
import logging

mail = Mail()

def send_verification_email(user):
    try:
        print(f"Starting send_verification_email for: {user.email}")  # Debug print
        
        verification_url = url_for('main.verify_email', 
                                 token=user.verification_token, 
                                 _external=True)
        print(f"Generated verification URL")  # Debug print
        
        msg = Message('Verify your SimpleDoc email',
                     sender=current_app.config['MAIL_DEFAULT_SENDER'],
                     recipients=[user.email])
        
        msg.html = render_template('email/verify.html',
                                 user=user,
                                 verification_url=verification_url)
        
        print("Attempting to send email...")  # Debug print
        mail.send(msg)
        print("Email sent successfully!")  # Debug print
        return True
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")  # Debug print
        logging.error(f"Failed to send verification email: {str(e)}")
        return False 