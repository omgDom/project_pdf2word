from .. import db
from datetime import datetime, timedelta
import uuid

class APIKey(db.Model):
    __tablename__ = 'api_key'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100))  # Name/description of the key
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used_at = db.Column(db.DateTime)
    
    # Rate limiting
    rate_limit = db.Column(db.Integer, default=1000)  # Requests per day
    requests_today = db.Column(db.Integer, default=0)
    rate_limit_reset = db.Column(db.DateTime)
    
    # Usage tracking
    total_requests = db.Column(db.Integer, default=0)
    
    def __init__(self, user_id, name=None, rate_limit=1000):
        self.key = self._generate_key()
        self.user_id = user_id
        self.name = name
        self.rate_limit = rate_limit
        self.rate_limit_reset = datetime.utcnow() + timedelta(days=1)
    
    @staticmethod
    def _generate_key():
        """Generate a unique API key"""
        return str(uuid.uuid4()).replace('-', '')
    
    def is_rate_limited(self):
        """Check if the key has exceeded its rate limit"""
        now = datetime.utcnow()
        
        # Reset counter if we're in a new day
        if now > self.rate_limit_reset:
            self.requests_today = 0
            self.rate_limit_reset = now + timedelta(days=1)
            db.session.commit()
        
        return self.requests_today >= self.rate_limit
    
    def log_request(self):
        """Log an API request"""
        self.requests_today += 1
        self.total_requests += 1
        self.last_used_at = datetime.utcnow()
        db.session.commit()
    
    @property
    def remaining_requests(self):
        """Get remaining requests for current period"""
        return max(0, self.rate_limit - self.requests_today)
    
    def to_dict(self):
        """Convert key to dictionary"""
        return {
            'id': self.id,
            'key': self.key,
            'name': self.name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'rate_limit': self.rate_limit,
            'requests_today': self.requests_today,
            'remaining_requests': self.remaining_requests,
            'rate_limit_reset': self.rate_limit_reset.isoformat() if self.rate_limit_reset else None
        } 