window.onbeforeunload = function(e) {
    // Check if there's a file selected
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    
    if (fileInput && fileInput.files.length > 0) {
        // Cancel the event
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = 'Changes you made may not be saved.';
        return 'Changes you made may not be saved.';
    }
}; 