// Add guard
if (typeof FileHandler === 'undefined') {
    class FileHandler {
        constructor() {
            console.log('Initializing FileHandler...');
            this.initializeElements();
            this.bindEvents();
        }

        initializeElements() {
            this.fileInput = document.getElementById('fileInput');
            this.uploadArea = document.getElementById('uploadArea');
            this.browseButton = document.getElementById('browseButton');
            this.convertButton = document.getElementById('convertButton');
            this.previewSection = document.getElementById('previewSection');
            
            // Debug checks
            if (!this.fileInput) console.error('File input not found');
            if (!this.uploadArea) console.error('Upload area not found');
            if (!this.browseButton) console.error('Browse button not found');
            if (!this.convertButton) console.error('Convert button not found');
        }

        bindEvents() {
            // Browse button click
            this.browseButton?.addEventListener('click', () => {
                this.fileInput.click();
            });

            // File input change
            this.fileInput?.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });

            // Drag and drop
            this.uploadArea?.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.add('dragover');
            });

            this.uploadArea?.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.remove('dragover');
            });

            this.uploadArea?.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length) {
                    this.fileInput.files = files;
                    this.handleFileSelect({ target: { files } });
                }
            });

            // Convert button
            this.convertButton?.addEventListener('click', () => {
                this.handleConversion();
            });
        }

        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file && file.type === 'application/pdf') {
                console.log('Valid PDF selected:', file.name);
                this.showFilePreview(file);
                this.convertButton.disabled = false;
                
                // Show filename
                const fileName = document.getElementById('fileName');
                if (fileName) {
                    fileName.textContent = file.name;
                }
            } else {
                console.error('Invalid file type');
                alert('Please select a PDF file');
            }
        }

        showFilePreview(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewSection.style.display = 'block';
                this.previewSection.innerHTML = `
                    <iframe 
                        src="${e.target.result}#toolbar=0" 
                        width="100%" 
                        height="500px" 
                        frameborder="0">
                    </iframe>
                `;
            };
            reader.readAsDataURL(file);
        }

        handleConversion() {
            if (this.fileInput.files.length > 0) {
                // Use the Converter class
                window.converter.convert(this.fileInput.files[0]);
            } else {
                alert('Please select a file first');
            }
        }
    }
    
    // Initialize when DOM loads
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing FileHandler...');
        window.fileHandler = new FileHandler();
    });
} 