// IMPORTANT: Do not use beforeunload as it's causing issues
// Instead, we'll use a custom solution with history state management

// Global variables
let conversionInProgress = false;
let customWarningAdded = false;

// Function to set conversion status
function setConversionStatus(inProgress) {
    console.log("Setting conversion status:", inProgress);
    
    conversionInProgress = inProgress;
    
    // If starting a conversion, set up navigation tracking
    if (inProgress && !customWarningAdded) {
        setupNavigationWarning();
    }
    // If conversion is complete, clean up
    else if (!inProgress && customWarningAdded) {
        removeNavigationWarning();
    }
}

// Add a custom warning system
function setupNavigationWarning() {
    customWarningAdded = true;
    console.log("Setting up custom navigation warning");
    
    // Add custom event listeners for navigation attempts
    document.querySelectorAll('a').forEach(link => {
        if (!link.dataset.warningAdded) {
            link.dataset.warningAdded = 'true';
            link.addEventListener('click', handleLinkClick);
        }
    });
    
    // Handle browser back/forward buttons using history API
    window.history.pushState({page: 'conversion'}, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
}

// Remove custom warning system
function removeNavigationWarning() {
    customWarningAdded = false;
    console.log("Removing custom navigation warning");
    
    // Remove custom event listeners
    document.querySelectorAll('a[data-warning-added="true"]').forEach(link => {
        link.removeEventListener('click', handleLinkClick);
        delete link.dataset.warningAdded;
    });
    
    // Remove popstate listener
    window.removeEventListener('popstate', handlePopState);
}

// Handle clicks on links
function handleLinkClick(e) {
    if (conversionInProgress) {
        console.log("Link click intercepted during conversion");
        
        // Check if this is the convert button
        const isConvertButton = e.currentTarget.id === 'convertButton';
        
        // If NOT the convert button and conversion is in progress, show warning
        if (!isConvertButton) {
            e.preventDefault();
            if (confirm('A conversion is in progress. If you leave now, it will be canceled. Do you want to continue?')) {
                // User confirmed, allow navigation by simulating another click
                conversionInProgress = false;
                e.currentTarget.click();
            }
        }
    }
}

// Handle browser back/forward buttons
function handlePopState(e) {
    if (conversionInProgress) {
        console.log("Browser navigation intercepted during conversion");
        
        // Add a new history state to prevent navigation
        window.history.pushState({page: 'conversion'}, '', window.location.href);
        
        // Show warning
        if (confirm('A conversion is in progress. If you leave now, it will be canceled. Do you want to continue?')) {
            // User confirmed, allow navigation
            conversionInProgress = false;
            window.history.back();
        }
    }
}

// Make function available globally
window.setConversionStatus = setConversionStatus; 