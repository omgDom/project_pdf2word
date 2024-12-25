document.addEventListener('DOMContentLoaded', function() {
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

    // Add conversion tracking
    const MAX_FREE_CONVERSIONS = 5;
    let conversionsUsed = parseInt(localStorage.getItem('conversionsUsed')) || 0;
    
    // Add conversion counter display
    const counterDiv = document.createElement('div');
    counterDiv.className = 'conversions-counter';
    counterDiv.innerHTML = `
        <span>${MAX_FREE_CONVERSIONS - conversionsUsed} free conversions remaining</span>
    `;
    document.querySelector('.converter-container').prepend(counterDiv);

    // Update button text when format changes
    formatSelect.addEventListener('change', function() {
        const selectedFormat = formatSelect.options[formatSelect.selectedIndex].text;
        convertButton.textContent = `Convert to ${selectedFormat}`;
    });

    // Set initial button text
    const initialFormat = formatSelect.options[formatSelect.selectedIndex].text;
    convertButton.textContent = `Convert to ${initialFormat}`;

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            handleFile(file);
        }
    });

    // Browse button functionality
    browseButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // Handle the selected file
    function handleFile(file) {
        fileName.textContent = file.name;
        filePreview.style.display = 'block';
        convertButton.disabled = false;
    }

    // Convert button functionality
    convertButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (file) {
            startConversion(file);
        }
    });

    // Simulated conversion process
    function startConversion(file) {
        // Check if user has free conversions left
        if (conversionsUsed >= MAX_FREE_CONVERSIONS) {
            showUpgradeModal();
            return;
        }

        convertButton.disabled = true;
        progressContainer.style.display = 'block';
        let progress = 0;

        const interval = setInterval(() => {
            progress += 1;
            progressFill.style.width = `${progress}%`;
            progressPercentage.textContent = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    // Increment conversion counter
                    conversionsUsed++;
                    localStorage.setItem('conversionsUsed', conversionsUsed);
                    updateConversionCounter();
                    
                    // Show download button
                    showDownloadButton();
                }, 500);
            }
        }, 50);
    }

    function updateConversionCounter() {
        const remaining = MAX_FREE_CONVERSIONS - conversionsUsed;
        document.querySelector('.conversions-counter span').textContent = 
            `${remaining} free conversions remaining`;
    }

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
        document.body.appendChild(modal);

        // Close modal functionality
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    // Reset the form after conversion
    function resetForm() {
        fileInput.value = '';
        filePreview.style.display = 'none';
        progressContainer.style.display = 'none';
        progressFill.style.width = '0%';
        progressPercentage.textContent = '0%';
        convertButton.disabled = true;
    }
}); 