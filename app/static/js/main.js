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
                    alert('Conversion completed!');
                    resetForm();
                }, 500);
            }
        }, 50);
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