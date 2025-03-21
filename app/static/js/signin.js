document.addEventListener('DOMContentLoaded', function() {
    // Debug logs to help trace the issue
    console.log('DOM Content Loaded');
    
    // Get modal elements
    const signInModal = document.getElementById('signInModal');
    console.log('Modal element:', signInModal);
    
    // If no modal exists, don't proceed
    if (!signInModal) {
        console.warn('Sign in modal not found');
        return;
    }
    
    const signInTriggers = document.querySelectorAll('.signin-trigger');
    const closeButton = signInModal.querySelector('.modal-close');
    const signInForm = document.getElementById('baseSignInForm');
    
    console.log('Triggers found:', signInTriggers.length);
    
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
    
    // Add click handlers to all signin triggers
    signInTriggers.forEach(trigger => {
        console.log('Adding click handler to trigger');
        trigger.addEventListener('click', openModal);
    });
    
    // Add close button handler
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    signInModal.addEventListener('click', (e) => {
        if (e.target === signInModal) closeModal();
    });
    
    // Optional: Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && signInModal.classList.contains('show')) {
            closeModal();
        }
    });
}); 