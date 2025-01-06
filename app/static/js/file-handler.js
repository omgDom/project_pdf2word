// Add at the top of the file, outside the class
window.addEventListener('beforeunload', function(e) {
    // Check if there's a file selected
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    
    if (fileInput && fileInput.files.length > 0 && filePreview && filePreview.style.display !== 'none') {
        // Cancel the event
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
    }
});

class FileHandler {
    constructor() {
        // Only initialize if we're on a page that needs file handling
        if (document.querySelector('.upload-area')) {
            this.initializeElements();
            if (this.validateElements()) {
                this.bindEvents();
            }
        }
        this.allowedTypes = ['.pdf', '.docx', '.txt', '.rtf', '.xlsx', '.pptx', '.epub', '.html', '.md', '.odt', '.jpeg'];
        this.hasUnsavedChanges = false;
        this.initializeBeforeUnload();
    }

    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.querySelector('.upload-area');
        this.browseButton = document.getElementById('browseButton');
        this.convertButton = document.getElementById('convertButton');
    }

    validateElements() {
        const elements = {
            fileInput: !!this.fileInput,
            uploadArea: !!this.uploadArea,
            browseButton: !!this.browseButton,
            convertButton: !!this.convertButton
        };

        // Only log if any element is missing
        if (!Object.values(elements).every(Boolean)) {
            console.warn('Missing FileHandler elements:', elements);
            return false;
        }

        return true;
    }

    bindEvents() {
        // Browse button click
        if (this.browseButton) {
            this.browseButton.addEventListener('click', () => {
                this.fileInput.click();
            });
        }

        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });
        }
    }

    initializeBeforeUnload() {
        // Add beforeunload event listener
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                // Standard message (browsers will show their own custom message)
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Set unsaved changes flag when file is selected
        if (this.fileInput) {
            this.fileInput.addEventListener('change', () => {
                this.hasUnsavedChanges = true;
            });
        }

        // Reset flag after successful conversion
        document.addEventListener('conversionComplete', () => {
            this.hasUnsavedChanges = false;
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (this.allowedTypes.includes(fileExtension)) {
            console.log('Valid file selected:', file.name);
            this.showFilePreview(file);
            this.hasUnsavedChanges = true; // Set flag when file is selected
            
            // Set DOCX as default format here as well
            const outputFormat = document.getElementById('outputFormat');
            if (outputFormat) {
                outputFormat.value = 'docx';
            }
            
            if (this.convertButton) {
                this.convertButton.disabled = false;
            }
        } else {
            console.error('Invalid file type');
            alert('Please select a supported file type');
            this.fileInput.value = '';
            if (this.convertButton) {
                this.convertButton.disabled = true;
            }
        }
    }

    showFilePreview(file) {
        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        const outputFormat = document.getElementById('outputFormat');
        
        if (filePreview && fileName) {
            filePreview.style.display = 'block';
            fileName.textContent = file.name;
            
            // Set DOCX as default output format
            if (outputFormat) {
                outputFormat.value = 'docx';
            }
        }
    }

    handleConversionSuccess() {
        this.hasUnsavedChanges = false;
        // ... rest of your success handling code ...
    }
}

// Remove the DOMContentLoaded event listener from here
// The initialization will be handled by init.js
window.FileHandler = FileHandler; 