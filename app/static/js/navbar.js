class NavbarManager {
    constructor() {
        console.log('NavbarManager initializing...');
        this.navbar = document.querySelector('.navbar');
        console.log('Navbar element:', this.navbar);
        this.lastScroll = 0;
        this.scrollThreshold = 10; // Minimum scroll amount before showing/hiding
        
        this.init();
    }

    init() {
        if (!this.navbar) {
            console.error('Navbar element not found!');
            return;
        }
        
        console.log('Adding scroll listener...');
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    handleScroll() {
        const currentScroll = window.pageYOffset;
        
        // Show/hide navbar based on scroll direction
        if (currentScroll > this.lastScroll && currentScroll > this.scrollThreshold) {
            // Scrolling down
            this.navbar.classList.add('hidden');
        } else {
            // Scrolling up
            this.navbar.classList.remove('hidden');
        }
        
        this.lastScroll = currentScroll;
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing NavbarManager...');
    new NavbarManager();
}); 