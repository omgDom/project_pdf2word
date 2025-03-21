document.addEventListener('DOMContentLoaded', function() {
    const password = document.getElementById('password');
    const requirements = {
        length: document.getElementById('length'),
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        number: document.getElementById('number'),
        special: document.getElementById('special')
    };

    password.addEventListener('input', function() {
        const value = this.value;
        
        // Check length
        if(value.length >= 8) {
            requirements.length.classList.add('valid');
        } else {
            requirements.length.classList.remove('valid');
        }
        
        // Check uppercase
        if(/[A-Z]/.test(value)) {
            requirements.uppercase.classList.add('valid');
        } else {
            requirements.uppercase.classList.remove('valid');
        }
        
        // Check lowercase
        if(/[a-z]/.test(value)) {
            requirements.lowercase.classList.add('valid');
        } else {
            requirements.lowercase.classList.remove('valid');
        }
        
        // Check number
        if(/\d/.test(value)) {
            requirements.number.classList.add('valid');
        } else {
            requirements.number.classList.remove('valid');
        }
        
        // Check special character
        if(/[ !@#$%&'()*+,-./[\\\]^_`{|}~"]/.test(value)) {
            requirements.special.classList.add('valid');
        } else {
            requirements.special.classList.remove('valid');
        }
    });
}); 