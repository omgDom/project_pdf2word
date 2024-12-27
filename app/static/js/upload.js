document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing upload handlers');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    if (!fileInput || !uploadArea) {
        console.error('Required elements not found');
        return;
    }

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop events
    uploadArea.addEventListener('dragenter', handleDrag);
    uploadArea.addEventListener('dragover', handleDrag);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    function handleDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            handleFileSelect({ target: fileInput });
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                // Show file preview
                const filePreview = document.getElementById('filePreview');
                const fileName = document.getElementById('fileName');
                if (filePreview && fileName) {
                    filePreview.style.display = 'block';
                    fileName.textContent = file.name;
                    document.getElementById('convertButton').disabled = false;
                }
            } else {
                alert('Please select a PDF file');
                fileInput.value = '';
            }
        }
    }
}); 