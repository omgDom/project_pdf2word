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
        if (!file) return;

        const allowedTypes = ['.pdf', '.docx', '.txt', '.rtf', '.xlsx', '.pptx', '.epub', '.html', '.md', '.odt', '.jpeg'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (allowedTypes.includes(fileExtension)) {
            // Show file preview
            const filePreview = document.getElementById('filePreview');
            const fileName = document.getElementById('fileName');
            if (filePreview && fileName) {
                filePreview.style.display = 'block';
                fileName.textContent = file.name;
                document.getElementById('convertButton').disabled = false;
            }
        } else {
            alert('Please select a supported file type');
            fileInput.value = '';
        }
    }
}); 