class DropboxService {
    constructor() {
        this.options = {
            success: this.handleDropboxSuccess.bind(this),
            cancel: this.handleDropboxCancel.bind(this),
            linkType: "preview",
            multiselect: false,
            extensions: ['.pdf'],
            folderselect: false,
            root: 'app'
        };
    }

    initialize() {
        const dropboxButton = document.getElementById('dropboxUpload');
        if (dropboxButton) {
            dropboxButton.addEventListener('click', () => this.openDropboxChooser());
        }
    }

    openDropboxChooser() {
        if (typeof Dropbox !== 'undefined') {
            Dropbox.choose(this.options);
        } else {
            console.error('Dropbox SDK not loaded');
            alert('Unable to connect to Dropbox. Please try again later.');
        }
    }

    async handleDropboxSuccess(files) {
        try {
            const file = files[0]; // Get first file since multiselect is false
            
            // Show loading state
            this.updateUIForLoading(true);
            
            // Download file from Dropbox
            const response = await fetch(file.link);
            const blob = await response.blob();
            
            // Create File object
            const pdfFile = new File([blob], file.name, {
                type: 'application/pdf'
            });

            // Update UI with file info
            this.updateFileInfo(pdfFile);
            
            // Trigger file handler
            if (window.fileHandler) {
                window.fileHandler.handleFiles([pdfFile]);
            }
        } catch (error) {
            console.error('Error handling Dropbox file:', error);
            alert('Error accessing file from Dropbox. Please try again.');
        } finally {
            this.updateUIForLoading(false);
        }
    }

    handleDropboxCancel() {
        console.log('Dropbox file selection cancelled');
    }

    updateUIForLoading(isLoading) {
        const uploadArea = document.querySelector('.upload-area');
        if (isLoading) {
            uploadArea.classList.add('loading');
            uploadArea.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Fetching file from Dropbox...</p>
                </div>
            `;
        } else {
            uploadArea.classList.remove('loading');
        }
    }

    updateFileInfo(file) {
        const uploadArea = document.querySelector('.upload-area');
        uploadArea.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-pdf"></i>
                <p>${file.name}</p>
                <small>${this.formatFileSize(file.size)}</small>
            </div>
        `;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
} 