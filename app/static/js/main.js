document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const browseButton = document.getElementById('browseButton');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const convertButton = document.getElementById('convertButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    const formatSelect = document.getElementById('formatSelect');

    // Conversion Limit Settings
    const MAX_FREE_CONVERSIONS = 5;
    let conversionsUsed = parseInt(localStorage.getItem('conversionsUsed')) || 0;

    // Initialize conversion counter
    const counterDiv = document.createElement('div');
    counterDiv.className = 'conversions-counter';
    counterDiv.innerHTML = `
        <span>${MAX_FREE_CONVERSIONS - conversionsUsed} free conversions remaining</span>
    `;
    document.querySelector('.converter-container').prepend(counterDiv);

    // Event Listeners
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    browseButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    formatSelect.addEventListener('change', updateConvertButtonText);

    // Drag and Drop Handlers
    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    }

    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }

    // File Processing
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                showFilePreview(file);
            } else {
                alert('Please select a PDF file.');
            }
        }
    }

    function showFilePreview(file) {
        fileName.textContent = file.name;
        filePreview.style.display = 'block';
        convertButton.disabled = false;
        updateConvertButtonText();
        convertButton.onclick = () => startConversion(file);
    }

    function updateConvertButtonText() {
        const selectedFormat = formatSelect.options[formatSelect.selectedIndex].text;
        convertButton.textContent = `Convert to ${selectedFormat}`;
    }

    // File Conversion
    function startConversion(file) {
        if (conversionsUsed >= MAX_FREE_CONVERSIONS) {
            showUpgradeModal();
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', formatSelect.value);

        convertButton.disabled = true;
        progressContainer.style.display = 'block';
        
        simulateProgressAndConvert(file, formData);
    }

    function simulateProgressAndConvert(file, formData) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            updateProgress(progress);

            if (progress >= 100) {
                clearInterval(interval);
                sendConversionRequest(file, formData);
            }
        }, 50);
    }

    function updateProgress(progress) {
        progressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
    }

    function sendConversionRequest(file, formData) {
        fetch('/convert', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) throw new Error('Conversion failed');
            return response.blob();
        })
        .then(blob => handleSuccessfulConversion(blob, file))
        .catch(handleConversionError)
        .finally(() => {
            convertButton.disabled = false;
        });
    }

    function handleSuccessfulConversion(blob, file) {
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const url = window.URL.createObjectURL(blob);
        
        createAndTriggerDownload(url, originalName);
        updateConversionCount();
        
        window.URL.revokeObjectURL(url);
    }

    function createAndTriggerDownload(url, originalName) {
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${originalName}.${formatSelect.value}`;
        downloadLink.className = 'download-btn';
        downloadLink.textContent = 'Download Converted File';
        
        const downloadContainer = document.createElement('div');
        downloadContainer.className = 'download-container';
        downloadContainer.appendChild(downloadLink);
        filePreview.appendChild(downloadContainer);
        
        downloadLink.click();
    }

    function handleConversionError(error) {
        console.error('Error:', error);
        alert('Conversion failed. Please try again.');
    }

    // Conversion Counter
    function updateConversionCount() {
        conversionsUsed++;
        localStorage.setItem('conversionsUsed', conversionsUsed);
        updateConversionCounter();
    }

    function updateConversionCounter() {
        const remaining = MAX_FREE_CONVERSIONS - conversionsUsed;
        document.querySelector('.conversions-counter span').textContent = 
            `${remaining} free conversions remaining`;
    }

    // Premium Modal
    function showUpgradeModal() {
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Upgrade Your Account</h2>
                <p>You've used all your free conversions. Choose an option to continue:</p>
                <div class="upgrade-options">
                    <a href="/signup" class="upgrade-btn">Create Free Account</a>
                    <a href="/pricing" class="upgrade-btn premium">Go Premium</a>
                </div>
                <button class="modal-close">&times;</button>
            </div>
        `;
        
        setupModalEventListeners(modal);
        document.body.appendChild(modal);
    }

    function setupModalEventListeners(modal) {
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    // Cookie Banner
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptButton = document.getElementById('accept-cookies');
    
    // Check if user has already accepted cookies
    if (!localStorage.getItem('cookiesAccepted')) {
        // Show banner with slight delay for smooth animation
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 1000);
    }

    acceptButton.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        cookieBanner.classList.remove('show');
    });

    // Cloud Service Integration
    const cloudButtons = document.querySelectorAll('.cloud-btn');
    
    // Initialize Google Drive API
    function initGoogleDrive() {
        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: 'YOUR_API_KEY',
                clientId: 'YOUR_CLIENT_ID',
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                scope: 'https://www.googleapis.com/auth/drive.readonly'
            });
        });
    }

    // Initialize Dropbox API
    function initDropbox() {
        const dropboxClient = new Dropbox.Client({ key: 'YOUR_APP_KEY' });
        dropboxClient.authenticate({ interactive: false });
    }

    // Cloud Service Click Handlers
    cloudButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const service = e.currentTarget.classList[1];
            
            switch(service) {
                case 'google-drive':
                    showCloudModal('Google Drive');
                    await loadGoogleDriveFiles();
                    break;
                case 'gmail':
                    showCloudModal('Gmail');
                    await loadGmailAttachments();
                    break;
                case 'dropbox':
                    showCloudModal('Dropbox');
                    await loadDropboxFiles();
                    break;
            }
        });
    });

    // Show Cloud Service Modal
    function showCloudModal(service) {
        const modal = document.createElement('div');
        modal.className = 'cloud-modal';
        modal.innerHTML = `
            <div class="cloud-modal-content">
                <div class="cloud-modal-header">
                    <h2>${service} Files</h2>
                    <button class="cloud-modal-close">&times;</button>
                </div>
                <div class="cloud-files-list">
                    <div class="loading">Loading files...</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('show'));

        modal.querySelector('.cloud-modal-close').onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };
    }

    // Load files from different services
    async function loadGoogleDriveFiles() {
        try {
            const response = await gapi.client.drive.files.list({
                pageSize: 20,
                fields: 'files(id, name, mimeType, modifiedTime)',
                q: "mimeType='application/pdf'"
            });

            displayFiles(response.result.files, 'drive');
        } catch (error) {
            console.error('Error loading Google Drive files:', error);
        }
    }

    async function loadGmailAttachments() {
        try {
            const response = await gapi.client.gmail.users.messages.list({
                userId: 'me',
                q: 'has:attachment filename:pdf'
            });

            // Process Gmail attachments
            const attachments = []; // Process response to get attachments
            displayFiles(attachments, 'gmail');
        } catch (error) {
            console.error('Error loading Gmail attachments:', error);
        }
    }

    async function loadDropboxFiles() {
        try {
            const response = await dropboxClient.filesListFolder({
                path: '',
                extensions: ['.pdf']
            });

            displayFiles(response.entries, 'dropbox');
        } catch (error) {
            console.error('Error loading Dropbox files:', error);
        }
    }

    // Display files in modal
    function displayFiles(files, service) {
        const filesList = document.querySelector('.cloud-files-list');
        filesList.innerHTML = files.map(file => `
            <div class="cloud-file-item" data-file-id="${file.id}">
                <i class="fas fa-file-pdf cloud-file-icon"></i>
                <div class="cloud-file-info">
                    <div class="cloud-file-name">${file.name}</div>
                    <div class="cloud-file-date">${new Date(file.modifiedTime).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers for file selection
        filesList.querySelectorAll('.cloud-file-item').forEach(item => {
            item.onclick = () => selectFile(item.dataset.fileId, service);
        });
    }

    // Handle file selection
    async function selectFile(fileId, service) {
        try {
            let file;
            switch(service) {
                case 'drive':
                    file = await downloadFromGoogleDrive(fileId);
                    break;
                case 'gmail':
                    file = await downloadFromGmail(fileId);
                    break;
                case 'dropbox':
                    file = await downloadFromDropbox(fileId);
                    break;
            }

            if (file) {
                handleFiles([file]);
                document.querySelector('.cloud-modal').remove();
            }
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    }
});