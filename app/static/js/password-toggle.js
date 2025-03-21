document.addEventListener('DOMContentLoaded', function() {
    const passwordInputs = document.querySelectorAll('.password-input-container input[type="password"]');
    
    passwordInputs.forEach(input => {
        const toggleBtn = input.nextElementSibling;
        const icon = toggleBtn.querySelector('i');
        
        toggleBtn.addEventListener('click', function() {
            // Toggle password visibility
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Toggle icon
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });
}); 