class ErrorHandler {
    static ERROR_TYPES = {
        FILE: 'FILE_ERROR',
        CONVERSION: 'CONVERSION_ERROR',
        NETWORK: 'NETWORK_ERROR',
        CLOUD: 'CLOUD_ERROR',
        VALIDATION: 'VALIDATION_ERROR',
        UNKNOWN: 'UNKNOWN_ERROR'
    };

    static ERROR_MESSAGES = {
        FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB',
        INVALID_TYPE: 'Invalid file type. Only PDF files are accepted',
        CONVERSION_FAILED: 'Failed to convert the file',
        NETWORK_OFFLINE: 'Please check your internet connection',
        CLOUD_AUTH_FAILED: 'Failed to authenticate with cloud service',
        CLOUD_FETCH_FAILED: 'Failed to fetch file from cloud storage'
    };

    static handleError(error, type = this.ERROR_TYPES.UNKNOWN) {
        console.error(`[${type}]`, error);

        // Show error in UI
        const errorMessage = this.getErrorMessage(error, type);
        this.showErrorUI(errorMessage);

        // Track error for analytics
        this.trackError(error, type);

        // Cleanup if needed
        this.errorCleanup(type);
    }

    static getErrorMessage(error, type) {
        // Return user-friendly error message based on type and error
        switch (type) {
            case this.ERROR_TYPES.FILE:
                return this.handleFileError(error);
            case this.ERROR_TYPES.CONVERSION:
                return this.handleConversionError(error);
            case this.ERROR_TYPES.NETWORK:
                return this.handleNetworkError(error);
            case this.ERROR_TYPES.CLOUD:
                return this.handleCloudError(error);
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }

    static handleFileError(error) {
        if (error.name === 'FileSizeError') {
            return this.ERROR_MESSAGES.FILE_TOO_LARGE;
        }
        if (error.name === 'FileTypeError') {
            return this.ERROR_MESSAGES.INVALID_TYPE;
        }
        return 'Error processing file. Please try again.';
    }

    static handleConversionError(error) {
        return this.ERROR_MESSAGES.CONVERSION_FAILED;
    }

    static handleNetworkError(error) {
        if (!navigator.onLine) {
            return this.ERROR_MESSAGES.NETWORK_OFFLINE;
        }
        return 'Network error. Please try again.';
    }

    static handleCloudError(error) {
        if (error.name === 'AuthError') {
            return this.ERROR_MESSAGES.CLOUD_AUTH_FAILED;
        }
        return this.ERROR_MESSAGES.CLOUD_FETCH_FAILED;
    }

    static showErrorUI(message) {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
            status.className = 'status-error';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                status.textContent = '';
                status.className = '';
            }, 5000);
        }

        // Reset UI elements
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }

        const convertButton = document.getElementById('convertButton');
        if (convertButton) {
            convertButton.disabled = false;
        }
    }

    static trackError(error, type) {
        // Implement error tracking/analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'error', {
                'event_category': type,
                'event_label': error.message
            });
        }
    }

    static errorCleanup(type) {
        // Cleanup based on error type
        switch (type) {
            case this.ERROR_TYPES.FILE:
                this.cleanupFileUpload();
                break;
            case this.ERROR_TYPES.CLOUD:
                this.cleanupCloudConnection();
                break;
            // Add other cleanup cases
        }
    }

    static cleanupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    static cleanupCloudConnection() {
        // Cleanup cloud provider connections
        // Reset auth tokens if needed
    }
}

// Custom error classes
class FileSizeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FileSizeError';
    }
}

class FileTypeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FileTypeError';
    }
}

class CloudAuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError';
    }
}

class ConversionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConversionError';
    }
}

class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}

class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
} 