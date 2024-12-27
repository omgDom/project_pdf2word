// REMOVE the entire class and initialization
class UIController {
    constructor() {
        // ... remove all this code ...
    }
    
    initializeFormatSelector() {
        // ... remove all this code ...
    }
    
    updateConvertButtonText() {
        // ... remove all this code ...
    }
}

// Remove this line
const uiController = new UIController(); 
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing UI Controller');
    new UIController();
}); 