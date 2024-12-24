class RetryAnalytics {
    static EVENTS = {
        RETRY_ATTEMPT: 'retry_attempt',
        RETRY_SUCCESS: 'retry_success',
        RETRY_FAILURE: 'retry_failure',
        RETRY_CANCELLED: 'retry_cancelled'
    };

    constructor() {
        this.retryData = {
            totalRetries: 0,
            successfulRetries: 0,
            failedRetries: 0,
            cancelledRetries: 0,
            averageAttempts: 0,
            errorTypes: {},
            retryDurations: []
        };
    }

    trackRetryAttempt(attempt, error, startTime) {
        const data = {
            timestamp: new Date().toISOString(),
            attemptNumber: attempt,
            errorType: error.name,
            errorMessage: error.message,
            fileType: 'PDF',
            duration: Date.now() - startTime
        };

        // Update local statistics
        this.retryData.totalRetries++;
        this.retryData.errorTypes[error.name] = (this.retryData.errorTypes[error.name] || 0) + 1;
        this.retryData.retryDurations.push(data.duration);

        // Send to analytics service
        this.sendToAnalytics(this.EVENTS.RETRY_ATTEMPT, data);

        return data;
    }

    trackRetryOutcome(success, attempts, totalDuration) {
        const outcome = success ? 'success' : 'failure';
        const data = {
            outcome,
            attempts,
            totalDuration,
            averageAttemptDuration: totalDuration / attempts
        };

        // Update statistics
        if (success) {
            this.retryData.successfulRetries++;
        } else {
            this.retryData.failedRetries++;
        }

        this.retryData.averageAttempts = 
            (this.retryData.totalRetries / 
             (this.retryData.successfulRetries + this.retryData.failedRetries));

        // Send to analytics service
        this.sendToAnalytics(
            success ? this.EVENTS.RETRY_SUCCESS : this.EVENTS.RETRY_FAILURE,
            data
        );

        return data;
    }

    trackRetryCancellation(attempts, duration) {
        const data = {
            attempts,
            duration,
            timestamp: new Date().toISOString()
        };

        this.retryData.cancelledRetries++;
        this.sendToAnalytics(this.EVENTS.RETRY_CANCELLED, data);

        return data;
    }

    getRetryStatistics() {
        return {
            ...this.retryData,
            successRate: this.calculateSuccessRate(),
            averageDuration: this.calculateAverageDuration(),
            mostCommonError: this.getMostCommonError()
        };
    }

    calculateSuccessRate() {
        const total = this.retryData.successfulRetries + this.retryData.failedRetries;
        return total ? (this.retryData.successfulRetries / total) * 100 : 0;
    }

    calculateAverageDuration() {
        const durations = this.retryData.retryDurations;
        return durations.length 
            ? durations.reduce((a, b) => a + b) / durations.length 
            : 0;
    }

    getMostCommonError() {
        return Object.entries(this.retryData.errorTypes)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
    }

    sendToAnalytics(eventName, data) {
        // Send to Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'Retry',
                event_label: JSON.stringify(data)
            });
        }

        // Send to custom backend
        fetch('/api/analytics/retry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: eventName,
                data: data
            })
        }).catch(console.error); // Don't wait for response
    }
} 