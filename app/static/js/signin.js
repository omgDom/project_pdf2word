document.addEventListener('DOMContentLoaded', function() {
    const signInButton = document.getElementById('signInButton');
    const signInModal = document.getElementById('signInModal');
    const closeButton = signInModal.querySelector('.modal-close');
    const signInForm = document.getElementById('signInForm');

    // Open modal
    signInButton.addEventListener('click', (e) => {
        e.preventDefault();
        signInModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });

    // Close modal
    function closeModal() {
        signInModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    closeButton.addEventListener('click', closeModal);
    signInModal.addEventListener('click', (e) => {
        if (e.target === signInModal) closeModal();
    });

    // Handle form submission
    signInForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Add your authentication logic here
        console.log('Sign in attempt:', { email, password, rememberMe });
    });
}); 