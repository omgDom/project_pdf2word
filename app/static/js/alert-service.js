class AlertService {
    static ALERT_TYPES = {
        ERROR_SPIKE: 'error_spike',
        HIGH_RETRY_RATE: 'high_retry_rate',
        SYSTEM_DEGRADATION: 'system_degradation',
        PERFORMANCE_ALERT: 'performance_alert',
        QUOTA_WARNING: 'quota_warning',
        SECURITY_ALERT: 'security_alert'
    };

    constructor() {
        this.thresholds = {
            errorRate: 0.2,          // 20% error rate
            retryAttempts: 3,        // Max retry attempts
            responseTime: 5000,      // 5 seconds
            quotaUsage: 0.8,         // 80% of quota
            successRate: 0.7         // 70% success rate
        };
        
        this.alerts = [];
        this.subscribers = new Set();
    }

    monitorMetrics(stats) {
        // 1. Error Rate Monitoring
        if (stats.errorRate > this.thresholds.errorRate) {
            this.createAlert({
                type: this.ALERT_TYPES.ERROR_SPIKE,
                message: `High error rate detected: ${(stats.errorRate * 100).toFixed(1)}%`,
                severity: 'high',
                timestamp: new Date()
            });
        }

        // 2. Retry Rate Monitoring
        if (stats.averageAttempts > this.thresholds.retryAttempts) {
            this.createAlert({
                type: this.ALERT_TYPES.HIGH_RETRY_RATE,
                message: `Excessive retry attempts: ${stats.averageAttempts.toFixed(1)} attempts/operation`,
                severity: 'medium',
                timestamp: new Date()
            });
        }

        // 3. Performance Monitoring
        if (stats.averageDuration > this.thresholds.responseTime) {
            this.createAlert({
                type: this.ALERT_TYPES.PERFORMANCE_ALERT,
                message: `Slow response times: ${(stats.averageDuration/1000).toFixed(1)}s average`,
                severity: 'medium',
                timestamp: new Date()
            });
        }

        // 4. System Health
        if (stats.successRate < this.thresholds.successRate) {
            this.createAlert({
                type: this.ALERT_TYPES.SYSTEM_DEGRADATION,
                message: `Low success rate: ${(stats.successRate * 100).toFixed(1)}%`,
                severity: 'high',
                timestamp: new Date()
            });
        }

        // 5. Quota Monitoring
        if (stats.quotaUsage > this.thresholds.quotaUsage) {
            this.createAlert({
                type: this.ALERT_TYPES.QUOTA_WARNING,
                message: `API quota nearly exceeded: ${(stats.quotaUsage * 100).toFixed(1)}% used`,
                severity: 'medium',
                timestamp: new Date()
            });
        }
    }

    createAlert(alert) {
        this.alerts.push(alert);
        this.notifySubscribers(alert);
        this.showNotification(alert);
        this.logAlert(alert);
    }

    showNotification(alert) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${alert.severity}`;
        notification.innerHTML = `
            <div class="alert-content">
                <strong>${alert.type}</strong>
                <p>${alert.message}</p>
                <small>${alert.timestamp.toLocaleTimeString()}</small>
            </div>
            <button class="alert-close">&times;</button>
        `;

        // Add to notification container
        const container = this.getNotificationContainer();
        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button
        notification.querySelector('.alert-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    getNotificationContainer() {
        let container = document.getElementById('alertContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'alertContainer';
            container.className = 'alert-container';
            document.body.appendChild(container);
        }
        return container;
    }

    subscribe(callback) {
        this.subscribers.add(callback);
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    notifySubscribers(alert) {
        this.subscribers.forEach(callback => callback(alert));
    }

    logAlert(alert) {
        // Log to backend
        fetch('/api/alerts/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(alert)
        }).catch(console.error);

        // Log to console with styling
        console.log(
            `%c[${alert.severity.toUpperCase()}] ${alert.type}`,
            `color: ${this.getSeverityColor(alert.severity)}; font-weight: bold;`,
            alert.message
        );
    }

    getSeverityColor(severity) {
        const colors = {
            low: '#4CAF50',
            medium: '#FFC107',
            high: '#F44336'
        };
        return colors[severity] || colors.medium;
    }
} 