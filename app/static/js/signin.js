document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing signin.js');
    
    const signInButton = document.getElementById('signInButton');
    const signInTriggers = document.querySelectorAll('.signin-trigger');
    const signInModal = document.getElementById('signInModal');
    
    // Guard clause - if no modal exists, don't proceed
    if (!signInModal) {
        console.warn('Sign in modal not found');
        return;
    }

    const closeButton = signInModal.querySelector('.modal-close');
    const signInForm = document.getElementById('baseSignInForm');

    // Function to open modal
    function openModal(e) {
        e.preventDefault();
        console.log('Opening modal');
        signInModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Function to close modal
    function closeModal() {
        console.log('Closing modal');
        signInModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Add click handlers only if elements exist
    if (signInButton) {
        signInButton.addEventListener('click', openModal);
    }

    if (signInTriggers.length > 0) {
        signInTriggers.forEach(trigger => {
            trigger.addEventListener('click', openModal);
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    if (signInModal) {
        signInModal.addEventListener('click', (e) => {
            if (e.target === signInModal) closeModal();
        });
    }

    // Handle form submission if form exists
    if (signInForm) {
        signInForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('baseSignInEmail')?.value || '';
            const password = document.getElementById('baseSignInPassword')?.value || '';
            const rememberMe = document.getElementById('baseRememberMe')?.checked || false;

            console.log('Sign in attempt:', { email, password, rememberMe });
        });
    }
}); 