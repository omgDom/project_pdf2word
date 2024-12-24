class Translator {
    constructor() {
        console.log('Initializing Translator...');
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Get all required elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.browseButton = document.getElementById('browseButton');
        this.translateButton = document.getElementById('translateButton');
        this.sourceLanguage = document.getElementById('sourceLanguage');
        this.targetLanguage = document.getElementById('targetLanguage');
        this.swapButton = document.getElementById('swapLanguages');
        this.progressContainer = document.getElementById('progressContainer');
        this.filePreview = document.getElementById('filePreview');
        this.fileName = document.getElementById('fileName');

        // Debug checks
        if (!this.fileInput) console.error('File input not found');
        if (!this.browseButton) console.error('Browse button not found');
        if (!this.uploadArea) console.error('Upload area not found');
    }

    bindEvents() {
        // Browse button click
        if (this.browseButton) {
            this.browseButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Browse button clicked');
                this.fileInput.click();
            });
        }

        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                console.log('File input changed');
                this.handleFileSelect(e);
            });
        }

        // Upload area drag and drop
        if (this.uploadArea) {
            this.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.add('dragover');
            });

            this.uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.remove('dragover');
            });

            this.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length) {
                    this.fileInput.files = files;
                    this.handleFileSelect({ target: { files } });
                }
            });

            // Make the entire upload area clickable
            this.uploadArea.addEventListener('click', (e) => {
                if (e.target !== this.browseButton) {
                    this.fileInput.click();
                }
            });
        }

        // Translate button
        if (this.translateButton) {
            this.translateButton.addEventListener('click', () => {
                this.translateDocument();
            });
        }

        // Swap languages button
        if (this.swapButton) {
            this.swapButton.addEventListener('click', () => {
                this.swapLanguages();
            });
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            
            // Check file type
            const allowedTypes = ['.pdf', '.docx', '.txt'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            
            if (allowedTypes.includes(fileExtension)) {
                // Update UI
                this.translateButton.disabled = false;
                this.fileName.textContent = file.name;
                this.filePreview.style.display = 'block';
                
                // Update upload area message
                const uploadMessage = this.uploadArea.querySelector('.upload-message p');
                if (uploadMessage) {
                    uploadMessage.textContent = `Selected: ${file.name}`;
                }
            } else {
                alert('Please select a valid file type (PDF, DOCX, or TXT)');
                this.fileInput.value = '';
                this.translateButton.disabled = true;
            }
        }
    }

    swapLanguages() {
        if (this.sourceLanguage.value !== 'auto') {
            const temp = this.sourceLanguage.value;
            this.sourceLanguage.value = this.targetLanguage.value;
            this.targetLanguage.value = temp;
        }
    }

    async translateDocument() {
        if (!this.fileInput.files.length) {
            alert('Please select a file first');
            return;
        }

        try {
            this.translateButton.disabled = true;
            this.progressContainer.style.display = 'block';
            
            const formData = new FormData();
            formData.append('file', this.fileInput.files[0]);
            formData.append('source_lang', this.sourceLanguage.value);
            formData.append('target_lang', this.targetLanguage.value);

            // Update progress bar
            let progress = 0;
            const progressFill = this.progressContainer.querySelector('.progress-fill');
            const progressText = this.progressContainer.querySelector('.progress-percentage');
            
            const progressInterval = setInterval(() => {
                if (progress < 90) {
                    progress += 10;
                    progressFill.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                }
            }, 500);

            const response = await fetch('/translate/convert', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Translation failed');
            }

            progressFill.style.width = '100%';
            progressText.textContent = '100%';

            const blob = await response.blob();
            this.downloadFile(blob, this.fileInput.files[0].name);

        } catch (error) {
            console.error('Translation error:', error);
            alert(`Translation error: ${error.message}`);
        } finally {
            this.translateButton.disabled = false;
            this.progressContainer.style.display = 'none';
            
            // Reset progress
            const progressFill = this.progressContainer.querySelector('.progress-fill');
            const progressText = this.progressContainer.querySelector('.progress-percentage');
            if (progressFill) progressFill.style.width = '0%';
            if (progressText) progressText.textContent = '0%';
        }
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${filename}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Translator...');
    window.translator = new Translator();
}); 