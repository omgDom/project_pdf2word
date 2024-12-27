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
        console.log('Converter constructor called');
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.convertButton = document.getElementById('convertButton');
        this.formatSelect = document.getElementById('formatSelect');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-percentage');
        
        console.log('Elements initialized:', {
            fileInput: this.fileInput,
            convertButton: this.convertButton,
            formatSelect: this.formatSelect
        });
    }

    bindEvents() {
        if (this.convertButton) {
            console.log('Binding convert button click');
            this.convertButton.addEventListener('click', (e) => {
                console.log('Convert button clicked');
                e.preventDefault();
                this.convert();
            });
        }
    }

    convert() {
        console.log('Convert method called');
        
        if (!this.fileInput) {
            console.error('File input missing');
            return;
        }

        if (!this.fileInput.files.length) {
            alert('Please select a file first');
            return;
        }

        const file = this.fileInput.files[0];
        const format = this.formatSelect ? this.formatSelect.value : 'docx';
        
        console.log('Converting:', {
            fileName: file.name,
            format: format
        });

        // Show progress container
        if (this.progressContainer) {
            this.progressContainer.style.display = 'block';
            this.progressFill.style.width = '0%';
            this.progressText.textContent = '0%';
        }

        // Create FormData and append format
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);

        // Start progress simulation with smoother increments and pause
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 70) {
                // Faster progress up to 70%
                progress += 5;
            } else if (progress === 70) {
                // Pause at 70% for 1.5 seconds
                clearInterval(progressInterval);
                setTimeout(() => {
                    // Continue with slower progress
                    const slowProgress = setInterval(() => {
                        if (progress < 90) {
                            progress += 2;
                            if (this.progressFill && this.progressText) {
                                this.progressFill.style.width = `${progress}%`;
                                this.progressText.textContent = `${progress}%`;
                            }
                        } else {
                            clearInterval(slowProgress);
                        }
                    }, 300);
                }, 1500);
            }
            
            if (this.progressFill && this.progressText) {
                this.progressFill.style.width = `${progress}%`;
                this.progressText.textContent = `${progress}%`;
            }
        }, 100);

        // Make API call
        fetch('/convert', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            clearInterval(progressInterval);
            if (!response.ok) throw new Error('Conversion failed');
            if (this.progressFill && this.progressText) {
                // Smooth transition to 100%
                this.progressFill.style.transition = 'width 0.5s ease-out';
                this.progressFill.style.width = '100%';
                this.progressText.textContent = '100%';
            }
            return response.blob();
        })
        .then(blob => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Conversion error:', error);
            alert('Error converting file');
        })
        .finally(() => {
            // Hide progress container after a short delay
            setTimeout(() => {
                if (this.progressContainer) {
                    this.progressContainer.style.display = 'none';
                    if (this.progressFill) {
                        this.progressFill.style.transition = 'none';
                        this.progressFill.style.width = '0%';
                    }
                    if (this.progressText) this.progressText.textContent = '0%';
                }
            }, 1000);
        });
    }
}

// Make Converter globally available
window.Converter = Converter; 