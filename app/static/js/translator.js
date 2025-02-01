class Translator {
    constructor() {
        console.log('Translator class initializing...');
        // Initialize elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseButton = document.getElementById('browseButton');
        this.translateButton = document.getElementById('translateButton');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');
        this.sourceLanguage = document.getElementById('sourceLanguage');
        this.targetLanguage = document.getElementById('targetLanguage');
        this.swapButton = document.getElementById('swapLanguages');
        this.filePreview = document.getElementById('filePreview');
        this.fileName = document.getElementById('fileName');

        // Set supported formats for translation
        if (this.fileInput) {
            this.fileInput.accept = '.pdf,.docx,.txt,.rtf,.xlsx,.pptx,.epub,.html,.md,.odt,.jpeg';
        }

        // Bind event listeners
        this.setupEventListeners();

        // Add after getting elements
        console.log('Elements found:', {
            uploadArea: this.uploadArea,
            fileInput: this.fileInput,
            browseButton: this.browseButton
        });
    }

    setupEventListeners() {
        if (this.browseButton) {
            this.browseButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.fileInput) {
                    this.fileInput.click();
                }
            });
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFile(file);
                }
            });
        }

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
                const file = e.dataTransfer.files[0];
                if (file) {
                    this.handleFile(file);
                }
            });
        }

        if (this.swapButton) {
            this.swapButton.addEventListener('click', () => this.swapLanguages());
        }

        if (this.translateButton) {
            this.translateButton.addEventListener('click', () => this.translateDocument());
        }
    }

    handleFile(file) {
        // Update UI to show selected file
        const fileName = file.name;
        const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Convert to MB
        
        // Create or update file info display
        let fileInfo = this.uploadArea.querySelector('.file-info');
        if (!fileInfo) {
            fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            this.uploadArea.appendChild(fileInfo);
        }
        
        fileInfo.innerHTML = `
            <p>Selected file: ${fileName}</p>
            <p>Size: ${fileSize} MB</p>
        `;

        // Enable translate button
        if (this.translateButton) {
            this.translateButton.disabled = false;
        }

        // Store the file for later use
        this.currentFile = file;
    }

    swapLanguages() {
        if (this.sourceLanguage.value !== 'auto') {
            const temp = this.sourceLanguage.value;
            this.sourceLanguage.value = this.targetLanguage.value;
            this.targetLanguage.value = temp;
        }
    }

    async translateDocument() {
        if (!this.currentFile) {
            alert('Please select a file first');
            return;
        }

        try {
            this.translateButton.disabled = true;
            this.progressSection.style.display = 'block';
            
            const formData = new FormData();
            formData.append('file', this.currentFile);
            formData.append('source_lang', this.sourceLanguage.value);
            formData.append('target_lang', this.targetLanguage.value);

            // Update progress bar
            let progress = 0;
            const progressInterval = setInterval(() => {
                if (progress < 90) {
                    progress += 10;
                    this.progressFill.style.width = `${progress}%`;
                    this.progressText.textContent = `${progress}%`;
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

            this.progressFill.style.width = '100%';
            this.progressText.textContent = 'Translation complete!';

            const blob = await response.blob();
            this.downloadFile(blob, this.currentFile.name);

        } catch (error) {
            console.error('Translation error:', error);
            alert(`Translation error: ${error.message}`);
        } finally {
            this.translateButton.disabled = false;
            this.progressSection.style.display = 'none';
            
            // Reset progress
            this.progressFill.style.width = '0%';
            this.progressText.textContent = '0%';
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

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const translator = new Translator();
}); 