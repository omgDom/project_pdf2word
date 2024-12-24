class NotificationService {
    static CHANNELS = {
        EMAIL: 'email',
        SMS: 'sms',
        PUSH: 'push',
        SLACK: 'slack'
    };

    static PRIORITIES = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };

    constructor() {
        this.userPreferences = this.loadUserPreferences();
        this.notificationQueue = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        // Load user preferences
        await this.loadUserPreferences();
        
        // Request notification permissions
        if ('Notification' in window) {
            await Notification.requestPermission();
        }
        
        this.initialized = true;
    }

    async sendNotification(alert) {
        const channels = this.determineChannels(alert);

        for (const channel of channels) {
            try {
                await this.dispatchNotification(channel, alert);
            } catch (error) {
                console.error(`Failed to send ${channel} notification:`, error);
                this.queueForRetry(channel, alert);
            }
        }
    }

    determineChannels(alert) {
        const channels = [];
        const prefs = this.userPreferences;

        switch (alert.severity) {
            case 'critical':
                if (prefs.smsEnabled) channels.push(this.CHANNELS.SMS);
                if (prefs.emailEnabled) channels.push(this.CHANNELS.EMAIL);
                if (prefs.slackEnabled) channels.push(this.CHANNELS.SLACK);
                break;
            case 'high':
                if (prefs.emailEnabled) channels.push(this.CHANNELS.EMAIL);
                if (prefs.slackEnabled) channels.push(this.CHANNELS.SLACK);
                break;
            case 'medium':
                if (prefs.emailEnabled && prefs.emailMediumPriority) {
                    channels.push(this.CHANNELS.EMAIL);
                }
                break;
            case 'low':
                if (prefs.emailEnabled && prefs.emailLowPriority) {
                    channels.push(this.CHANNELS.EMAIL);
                }
                break;
        }

        return channels;
    }

    async dispatchNotification(channel, alert) {
        switch (channel) {
            case this.CHANNELS.EMAIL:
                await this.sendEmailNotification(alert);
                break;
            case this.CHANNELS.SMS:
                await this.sendSMSNotification(alert);
                break;
            case this.CHANNELS.SLACK:
                await this.sendSlackNotification(alert);
                break;
        }
    }

    async sendEmailNotification(alert) {
        const response = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: this.userPreferences.email,
                subject: `Alert: ${alert.type}`,
                message: this.formatEmailMessage(alert)
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send email notification');
        }
    }

    async sendSMSNotification(alert) {
        const response = await fetch('/api/notifications/sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: this.userPreferences.phone,
                message: this.formatSMSMessage(alert)
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send SMS notification');
        }
    }

    formatEmailMessage(alert) {
        return `
            <h2>Alert: ${alert.type}</h2>
            <p><strong>Severity:</strong> ${alert.severity}</p>
            <p><strong>Message:</strong> ${alert.message}</p>
            <p><strong>Time:</strong> ${alert.timestamp.toLocaleString()}</p>
            <hr>
            <p>View details in the dashboard: <a href="${window.location.origin}/dashboard">Open Dashboard</a></p>
        `;
    }

    formatSMSMessage(alert) {
        return `Alert [${alert.severity}]: ${alert.message}`;
    }

    queueForRetry(channel, alert) {
        this.notificationQueue.push({
            channel,
            alert,
            attempts: 0,
            nextAttempt: Date.now() + 5000 // 5 seconds delay
        });
    }

    async processQueue() {
        const now = Date.now();
        const maxAttempts = 3;

        this.notificationQueue = this.notificationQueue.filter(async (item) => {
            if (item.nextAttempt <= now && item.attempts < maxAttempts) {
                item.attempts++;
                try {
                    await this.dispatchNotification(item.channel, item.alert);
                    return false; // Remove from queue if successful
                } catch (error) {
                    item.nextAttempt = now + (item.attempts * 5000); // Exponential backoff
                    return true; // Keep in queue
                }
            }
            return item.attempts < maxAttempts;
        });
    }

    loadUserPreferences() {
        // Load from localStorage or API
        return {
            email: 'user@example.com',
            phone: '+1234567890',
            emailEnabled: true,
            smsEnabled: true,
            slackEnabled: false,
            emailLowPriority: false,
            emailMediumPriority: true,
            emailHighPriority: true
        };
    }
} 