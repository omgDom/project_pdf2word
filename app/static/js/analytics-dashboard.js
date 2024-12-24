class AnalyticsDashboard {
    constructor(analytics) {
        this.analytics = analytics;
        this.updateInterval = 5000; // 5 seconds
    }

    initialize() {
        this.createDashboard();
        this.startUpdates();
    }

    createDashboard() {
        const dashboard = document.createElement('div');
        dashboard.className = 'analytics-dashboard';
        dashboard.innerHTML = `
            <h3>Retry Analytics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Success Rate</h4>
                    <p id="successRate">0%</p>
                </div>
                <div class="stat-card">
                    <h4>Average Attempts</h4>
                    <p id="avgAttempts">0</p>
                </div>
                <div class="stat-card">
                    <h4>Common Error</h4>
                    <p id="commonError">None</p>
                </div>
            </div>
        `;
        document.body.appendChild(dashboard);
    }

    startUpdates() {
        setInterval(() => {
            this.updateStats();
        }, this.updateInterval);
    }

    updateStats() {
        const stats = this.analytics.getRetryStatistics();
        
        document.getElementById('successRate').textContent = 
            `${stats.successRate.toFixed(1)}%`;
        document.getElementById('avgAttempts').textContent = 
            stats.averageAttempts.toFixed(1);
        document.getElementById('commonError').textContent = 
            stats.mostCommonError;
    }
} 