document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    
    // Check if required classes are available
    if (typeof FileHandler === 'undefined') {
        console.error('FileHandler class not loaded');
        return;
    }

    // Initialize FileHandler
    window.fileHandler = new FileHandler();
}); 