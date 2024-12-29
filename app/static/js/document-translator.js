class DocumentTranslator {
    constructor() {
        // DOM Elements
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('documentFile');
        this.browseButton = document.getElementById('browseButton');
        this.translationOptions = document.querySelector('.translation-options');
        this.swapButton = document.getElementById('swapLanguages');
        this.translateButton = document.getElementById('translateButton');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');
        this.pageCount = document.getElementById('pageCount');
        this.wordCount = document.getElementById('wordCount');
        this.timeLeft = document.getElementById('timeLeft');
        
        // State
        this.currentFile = null;
        this.translationInProgress = false;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload handlers
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.browseButton.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Language swap handler
        this.swapButton.addEventListener('click', this.swapLanguages.bind(this));

        // Translation handler
        this.translateButton.addEventListener('click', this.startTranslation.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length) {
            this.handleFiles(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFiles(file);
        }
    }

    handleFiles(file) {
        // Validate file type
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/rtf'
        ];
        
        if (!validTypes.includes(file.type)) {
            this.showError('Please upload a valid document format (PDF, DOC, DOCX, TXT, or RTF)');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.showError('File size exceeds 10MB limit');
            return;
        }

        this.currentFile = file;
        this.showTranslationOptions();
        this.updateFileInfo(file);
    }

    updateFileInfo(file) {
        // Update UI with file information
        const fileName = document.createElement('p');
        fileName.textContent = `Selected file: ${file.name}`;
        fileName.className = 'selected-file-name';
        
        // Remove any existing file name display
        const existingFileName = this.dropZone.querySelector('.selected-file-name');
        if (existingFileName) {
            existingFileName.remove();
        }
        
        this.dropZone.appendChild(fileName);
    }

    showTranslationOptions() {
        this.translationOptions.style.display = 'block';
        this.translateButton.disabled = false;
    }

    swapLanguages() {
        const sourceSelect = document.getElementById('sourceLanguage');
        const targetSelect = document.getElementById('targetLanguage');
        
        // Don't swap if source is auto-detect
        if (sourceSelect.value === 'auto') {
            return;
        }

        const temp = sourceSelect.value;
        sourceSelect.value = targetSelect.value;
        targetSelect.value = temp;

        // Add animation class
        this.swapButton.classList.add('rotating');
        setTimeout(() => {
            this.swapButton.classList.remove('rotating');
        }, 300);
    }

    async startTranslation() {
        if (!this.currentFile || this.translationInProgress) {
            return;
        }

        try {
            this.translationInProgress = true;
            this.translateButton.disabled = true;
            this.progressSection.style.display = 'block';

            const formData = new FormData();
            formData.append('file', this.currentFile);
            formData.append('source_lang', document.getElementById('sourceLanguage').value);
            formData.append('target_lang', document.getElementById('targetLanguage').value);
            formData.append('preserve_formatting', document.getElementById('preserveFormatting').checked);
            formData.append('translate_comments', document.getElementById('translateComments').checked);

            // Start the translation process
            const response = await fetch('/api/translate', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Translation failed: ${response.statusText}`);
            }

            // Handle progress updates through SSE or WebSocket
            this.handleTranslationProgress();

            const result = await response.json();
            this.handleTranslationComplete(result);

        } catch (error) {
            console.error('Translation error:', error);
            this.showError('An error occurred during translation. Please try again.');
        } finally {
            this.translationInProgress = false;
        }
    }

    handleTranslationProgress() {
        // Connect to SSE endpoint for progress updates
        const eventSource = new EventSource('/api/translate/progress');
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.updateProgress(data);
        };

        eventSource.onerror = () => {
            eventSource.close();
        };
    }

    updateProgress(data) {
        const { percentage, pages, words, estimatedTime } = data;
        
        // Update progress bar
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `Processing... ${percentage}%`;

        // Update statistics
        if (pages) this.pageCount.textContent = pages;
        if (words) this.wordCount.textContent = words;
        if (estimatedTime) this.timeLeft.textContent = this.formatTime(estimatedTime);
    }

    formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    }

    handleTranslationComplete(result) {
        // Update UI to show completion
        this.progressFill.style.width = '100%';
        this.progressText.textContent = 'Translation complete!';

        // Create download link
        this.createDownloadLink(result.downloadUrl);
    }

    createDownloadLink(url) {
        const downloadSection = document.createElement('div');
        downloadSection.className = 'download-section';
        downloadSection.innerHTML = `
            <a href="${url}" class="download-btn">
                <i class="fas fa-download"></i>
                Download Translated Document
            </a>
        `;
        
        this.progressSection.appendChild(downloadSection);
    }

    showError(message) {
        // You can implement your preferred error display method
        alert(message);
    }

    reset() {
        this.currentFile = null;
        this.translationInProgress = false;
        this.translationOptions.style.display = 'none';
        this.progressSection.style.display = 'none';
        this.translateButton.disabled = true;
        this.fileInput.value = '';
        
        // Remove file info display
        const fileInfo = this.dropZone.querySelector('.selected-file-name');
        if (fileInfo) fileInfo.remove();
        
        // Reset progress and stats
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '';
        this.pageCount.textContent = '0';
        this.wordCount.textContent = '0';
        this.timeLeft.textContent = '--:--';
    }
}

// Initialize translator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocumentTranslator();
}); 