console.log('Theme.js loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Set initial state based on localStorage
    const currentTheme = localStorage.getItem('theme') || 'light';
    darkModeToggle.checked = currentTheme === 'dark';
    
    // Toggle theme when checkbox changes
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
});

console.log('Theme.js loaded');

// Function to update any dynamic elements
function updateDynamicElements(theme) {
    // Update language selectors
    const languageSelects = document.querySelectorAll('.language-select');
    languageSelects.forEach(select => {
        if (theme === 'dark') {
            select.style.backgroundColor = 'var(--card-bg)';
            select.style.color = '#ffffff';
        } else {
            select.style.backgroundColor = 'var(--bg-color)';
            select.style.color = 'var(--text-color)';
        }
    });
} 