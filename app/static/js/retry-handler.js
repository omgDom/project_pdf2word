class RetryHandler {
    constructor() {
        this.analytics = new RetryAnalytics();
    }

    async withRetry(operation, options = {}) {
        const startTime = Date.now();
        let attempts = 0;

        try {
            const result = await this._performRetry(operation, options, startTime);
            
            // Track successful retry
            this.analytics.trackRetryOutcome(
                true,
                attempts,
                Date.now() - startTime
            );

            return result;

        } catch (error) {
            // Track failed retry
            this.analytics.trackRetryOutcome(
                false,
                attempts,
                Date.now() - startTime
            );

            throw error;
        }
    }

    async _performRetry(operation, options, startTime) {
        let attempts = 0;
        
        while (true) {
            try {
                attempts++;
                return await operation();
            } catch (error) {
                // Track retry attempt
                this.analytics.trackRetryAttempt(
                    attempts,
                    error,
                    startTime
                );

                if (attempts >= options.maxAttempts) {
                    throw error;
                }

                await this.delay(options.delayMs * Math.pow(options.backoff, attempts - 1));
            }
        }
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 