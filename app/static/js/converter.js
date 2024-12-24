function isConverterPage() {
    // Check if we're on the converter page by looking for a key element
    return document.getElementById('fileInput') !== null;
}

// Wrap the initialization in a check
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the converter page
    if (isConverterPage()) {
        console.log('Initializing converter...');
        window.converter = new Converter();
    } else {
        console.log('Not on converter page, skipping initialization');
    }
});

class Converter {
    constructor() {
        this.initializeElements();
        if (this.hasRequiredElements()) {
            this.bindEvents();
        }
    }

    hasRequiredElements() {
        return (
            this.fileInput &&
            this.uploadArea &&
            this.browseButton
        );
    }

    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.browseButton = document.getElementById('browseButton');
        this.convertButton = document.getElementById('convertButton');
        this.previewSection = document.getElementById('previewSection');
        this.closePreviewButton = document.getElementById('closePreview');

        // Debug checks
        if (!this.fileInput) console.error('File input not found');
        if (!this.browseButton) console.error('Browse button not found');
        if (!this.uploadArea) console.error('Upload area not found');
        if (!this.convertButton) console.error('Convert button not found');
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
        }

        // Convert button
        if (this.convertButton) {
            this.convertButton.addEventListener('click', () => {
                this.convertFile();
            });
        }

        // Add preview close button handler
        if (this.closePreviewButton && this.previewSection) {
            this.closePreviewButton.addEventListener('click', () => {
                this.previewSection.style.display = 'none';
            });
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            
            // Check if it's a PDF
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                // Show preview
                this.showPreview(file);
                
                // Update UI
                this.convertButton.disabled = false;
                this.previewSection.style.display = 'block';
                document.querySelector('.preview-overlay').style.display = 'block';
                
                // Update upload area message
                const uploadMessage = this.uploadArea.querySelector('.upload-message p');
                if (uploadMessage) {
                    uploadMessage.textContent = `Selected: ${file.name}`;
                }
            } else {
                alert('Please select a PDF file');
                this.fileInput.value = '';
                this.convertButton.disabled = true;
            }
        }
    }

    removeFile() {
        this.fileInput.value = '';
        this.convertButton.disabled = true;
        this.previewSection.style.display = 'none';
        this.uploadArea.querySelector('.upload-message p').textContent = 'Drag & drop your PDF here or';
    }

    async convertFile() {
        if (!this.fileInput.files.length) {
            alert('Please select a file first');
            return;
        }

        try {
            this.convertButton.disabled = true;
            this.convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

            const formData = new FormData();
            formData.append('file', this.fileInput.files[0]);

            console.log('Sending file to server...');
            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Conversion failed: ${response.statusText}`);
            }

            console.log('Conversion successful');
            const blob = await response.blob();
            this.downloadFile(blob, this.fileInput.files[0].name);

        } catch (error) {
            console.error('Conversion error:', error);
            alert('Error converting file. Please try again.');
        } finally {
            this.convertButton.disabled = false;
            this.convertButton.innerHTML = 'Convert to DOCX';
        }
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.pdf', '.docx');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showPreview(file) {
        // Create a URL for the PDF file
        const fileUrl = URL.createObjectURL(file);
        
        // Initialize PDF.js viewer (you'll need to include PDF.js in your project)
        pdfjsLib.getDocument(fileUrl).promise.then(pdf => {
            this.pdfDoc = pdf;
            this.currentPage = 1;
            this.renderPage(this.currentPage);
            
            // Update page info
            document.getElementById('pageInfo').textContent = 
                `Page ${this.currentPage} of ${pdf.numPages}`;
                
            // Enable/disable page buttons
            this.updatePageButtons();
        });
    }

    renderPage(num) {
        this.pdfDoc.getPage(num).then(page => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 1.5 });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            const pdfViewer = document.getElementById('pdfViewer');
            pdfViewer.innerHTML = '';
            pdfViewer.appendChild(canvas);

            page.render(renderContext);
        });
    }

    updatePageButtons() {
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        
        prevButton.disabled = this.currentPage <= 1;
        nextButton.disabled = this.currentPage >= this.pdfDoc.numPages;
    }
}

// Format selection and button text update
document.getElementById('outputFormat').addEventListener('change', function() {
    const format = this.value.toUpperCase();
    const convertButton = document.getElementById('convertButton');
    
    // Update button text with icon based on format
    let icon = '';
    switch(format) {
        case 'DOCX':
            icon = 'fa-file-word';
            break;
        case 'TXT':
            icon = 'fa-file-alt';
            break;
        case 'HTML':
            icon = 'fa-file-code';
            break;
        case 'CSV':
            icon = 'fa-file-csv';
            break;
        case 'PPT':
            icon = 'fa-file-powerpoint';
            break;
        case 'RTF':
            icon = 'fa-file-alt';
            break;
        case 'JPG':
        case 'PNG':
            icon = 'fa-file-image';
            break;
        default:
            icon = 'fa-file';
    }
    
    convertButton.innerHTML = `
        <i class="fas ${icon}"></i>
        Convert to ${format}
    `;
});

// Update initial button state
document.addEventListener('DOMContentLoaded', function() {
    const initialFormat = document.getElementById('outputFormat').value.toUpperCase();
    const convertButton = document.getElementById('convertButton');
    convertButton.innerHTML = `
        <i class="fas fa-file-word"></i>
        Convert to ${initialFormat}
    `;
});

// Preview handling
function showPreview(file) {
    const previewSection = document.getElementById('previewSection');
    previewSection.style.display = 'block';
    
    // Initialize PDF preview here using PDF.js or similar library
    // This is a placeholder - you'll need to implement the actual PDF preview
}

// Add this to your existing JavaScript
document.querySelector('.convert-btn').addEventListener('mousemove', function(e) {
    if (!this.disabled) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate the percentage positions
        const px = ((x / rect.width) * 100).toFixed(2);
        const py = ((y / rect.height) * 100).toFixed(2);
        
        // Update the radial gradient position to follow cursor
        this.style.backgroundImage = `radial-gradient(circle at ${px}% ${py}%, var(--primary-color), #4338CA)`;
    }
});

// Reset gradient when mouse leaves
document.querySelector('.convert-btn').addEventListener('mouseleave', function() {
    if (!this.disabled) {
        this.style.backgroundImage = 'radial-gradient(circle at 50% 50%, var(--primary-color), #4338CA)';
    }
});

// Handle dark mode
document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('.convert-btn');
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        button.style.backgroundImage = 'radial-gradient(circle at 50% 50%, #6366F1, #4F46E5)';
    }
}); 