document.addEventListener('DOMContentLoaded', function() {
    // Cloud Service Click Handlers
    const cloudButtons = document.querySelectorAll('.service-btn');
    if (cloudButtons) {
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
    }

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
});