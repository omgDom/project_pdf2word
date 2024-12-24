// UI-related logic
class UIController {
    constructor() {
        this.initializeFormatSelector();
    }

    initializeFormatSelector() {
        const formatSelector = document.getElementById('outputFormat');
        const convertButton = document.getElementById('convertButton');

        if (formatSelector && convertButton) {
            // Set initial button text
            this.updateConvertButtonText(formatSelector.value);

            // Update button text when format changes
            formatSelector.addEventListener('change', (e) => {
                this.updateConvertButtonText(e.target.value);
            });
        }
    }

    updateConvertButtonText(format) {
        const convertButton = document.getElementById('convertButton');
        if (convertButton) {
            const formatText = format.toUpperCase();
            convertButton.textContent = `Convert to ${formatText}`;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
}); 