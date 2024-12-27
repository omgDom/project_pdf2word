// Remove the guard and DOMContentLoaded event
class FileHandler {
    constructor() {
        // Only initialize if we're on a page that needs file handling
        if (document.querySelector('.upload-area')) {
            this.initializeElements();
            if (this.validateElements()) {
                this.bindEvents();
            }
        }
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

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
            console.log('Valid PDF selected:', file.name);
            this.showFilePreview(file);
            if (this.convertButton) {
                this.convertButton.disabled = false;
            }
        } else {
            console.error('Invalid file type');
            alert('Please select a PDF file');
            this.fileInput.value = '';
            if (this.convertButton) {
                this.convertButton.disabled = true;
            }
        }
    }

    showFilePreview(file) {
        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        if (filePreview && fileName) {
            filePreview.style.display = 'block';
            fileName.textContent = file.name;
        }
    }
}

// Remove the DOMContentLoaded event listener from here
// The initialization will be handled by init.js
window.FileHandler = FileHandler; 