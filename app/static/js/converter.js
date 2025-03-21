function isConverterPage() {
    // Check if we're on the converter page by looking for a key element
    return document.getElementById('fileInput') !== null;
}

// Wrap the initialization in a check
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the converter page
    if (isConverterPage()) {
        console.log('Initializing converter...');
        window.converter = new Converter();
    } else {
        console.log('Not on converter page, skipping initialization');
    }
});

class Converter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.conversionInProgress = false;
    }

    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.convertButton = document.getElementById('convertButton');
        this.formatSelect = document.getElementById('outputFormat');
        this.progressContainer = document.querySelector('.progress-container');
        this.progressBar = document.getElementById('conversionProgress');
        this.progressText = document.getElementById('progressPercent');
    }

    bindEvents() {
        // Convert button click
        if (this.convertButton) {
            this.convertButton.addEventListener('click', (e) => {
                // Add a data attribute to identify this as the convert button
                this.convertButton.setAttribute('id', 'convertButton');
                this.convert();
            });
        }

        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Enable convert button when file is selected
                    if (this.convertButton) {
                        this.convertButton.disabled = false;
                    }
                }
            });
        }
    }

    showProgress() {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'block';
        }
    }

    hideProgress() {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }
    }

    updateProgress(percent) {
        const progressBar = document.getElementById('conversionProgress');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    }

    showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'success-message';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <p>${message}</p>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }

    async convert() {
        console.log('Convert method called');
        
        if (!this.fileInput || !this.fileInput.files.length) {
            this.showAlert('Please select a file first', 'error');
            return;
        }

        const file = this.fileInput.files[0];
        const format = this.formatSelect ? this.formatSelect.value : 'pdf';
        
        // First show visual feedback that the conversion is starting
        this.showProgress();
        this.updateProgress(0);

        // Set local conversion tracking
        this.conversionInProgress = true;
        
        // No need for delay - our new approach doesn't use beforeunload
        if (typeof window.setConversionStatus === 'function') {
            window.setConversionStatus(true);
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);

        try {
            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (progress <= 90) {
                    this.updateProgress(progress);
                }
            }, 500);

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Conversion result:', result);

            // Complete the progress bar
            this.updateProgress(100);
            
            if (result.downloadUrl) {
                // Mark conversion as complete BEFORE navigation
                this.conversionInProgress = false;
                
                // Set global conversion status to false
                if (typeof window.setConversionStatus === 'function') {
                    window.setConversionStatus(false);
                }
                
                // Start download immediately without showing success message
                setTimeout(() => {
                    window.location.href = result.downloadUrl;
                }, 100);
                
                // Hide progress after download starts
                setTimeout(() => {
                    this.hideProgress();
                    this.updateProgress(0);
                }, 1000);
            } else {
                throw new Error('No download URL in response');
            }

        } catch (error) {
            // Mark conversion as failed
            this.conversionInProgress = false;
            
            // Set global conversion status to false when error occurs
            if (typeof window.setConversionStatus === 'function') {
                window.setConversionStatus(false);
            }
            
            console.error('Conversion error:', error);
            this.hideProgress();
            this.showAlert(`Error converting file: ${error.message}`, 'error');
        }
    }
}

// Make Converter globally available
window.Converter = Converter; 