let lastScroll = 0;
const navbar = document.querySelector('.navbar');
const scrollThreshold = 100; // Minimum scroll before navbar hides

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Show/hide navbar based on scroll direction
    if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
        // Scrolling down & past threshold - hide navbar
        navbar.classList.add('navbar-hidden');
    } else {
        // Scrolling up or at top - show navbar
        navbar.classList.remove('navbar-hidden');
    }
    
    lastScroll = currentScroll;
}); 