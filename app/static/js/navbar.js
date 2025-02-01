let lastScroll = 0;
const navbar = document.querySelector('.navbar');
const scrollThreshold = 100; // Minimum scroll before navbar hides

// Create backdrop element
const backdrop = document.createElement('div');
backdrop.className = 'menu-backdrop';
document.body.appendChild(backdrop);

// Add hamburger menu functionality
const hamburgerButton = document.createElement('button');
hamburgerButton.className = 'hamburger';
hamburgerButton.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
`;

const navbarContainer = document.querySelector('.navbar-container');
const navbarLinks = document.querySelector('.navbar-links');

// Insert hamburger before navbar-links
navbarContainer.insertBefore(hamburgerButton, navbarLinks);

// Toggle menu on hamburger click
hamburgerButton.addEventListener('click', () => {
    hamburgerButton.classList.toggle('active');
    navbarLinks.classList.toggle('active');
    backdrop.classList.toggle('active');
    document.body.classList.toggle('body-lock');
});

// Close menu when clicking backdrop
backdrop.addEventListener('click', () => {
    hamburgerButton.classList.remove('active');
    navbarLinks.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.classList.remove('body-lock');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburgerButton.contains(e.target) && !navbarLinks.contains(e.target)) {
        hamburgerButton.classList.remove('active');
        navbarLinks.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.classList.remove('body-lock');
    }
});

// Hide menu on scroll
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
        navbar.classList.add('navbar-hidden');
        // Close menu when hiding navbar
        hamburgerButton.classList.remove('active');
        navbarLinks.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.classList.remove('body-lock');
    } else {
        navbar.classList.remove('navbar-hidden');
    }
    
    lastScroll = currentScroll;
});

// Close menu on window resize if mobile menu is open
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navbarLinks.classList.contains('active')) {
        hamburgerButton.classList.remove('active');
        navbarLinks.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.classList.remove('body-lock');
    }
});

// Update the close functions
function closeMenu() {
    hamburgerButton.classList.remove('active');
    navbarLinks.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.classList.remove('body-lock');
} 