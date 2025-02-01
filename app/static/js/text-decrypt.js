class TextDecrypt {
    constructor(element, options = {}) {
        this.element = element;
        this.originalText = element.dataset.text || element.textContent;
        this.options = {
            speed: options.speed || 50,
            characters: options.characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+',
            maxIterations: options.maxIterations || 15,
            stagger: options.stagger || false,
            ...options
        };
        
        this.init();
    }

    init() {
        this.element.innerHTML = [...this.originalText].map(char => 
            `<span class="decrypt-char">${char}</span>`
        ).join('');
        
        this.chars = this.element.querySelectorAll('.decrypt-char');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animate();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(this.element);
    }

    getRandomChar() {
        return this.options.characters[Math.floor(Math.random() * this.options.characters.length)];
    }

    animate() {
        this.chars.forEach((char, index) => {
            const originalChar = this.originalText[index];
            if (originalChar === ' ') return;

            let iterations = 0;
            const interval = setInterval(() => {
                char.textContent = this.getRandomChar();
                iterations++;

                if (iterations === this.options.maxIterations) {
                    clearInterval(interval);
                    char.textContent = originalChar;
                    char.classList.add('revealed');
                }
            }, this.options.speed + (this.options.stagger ? (index * 30) : 0));
        });
    }
}

// Initialize only for the title
document.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('.translator-title');
    if (title) {
        new TextDecrypt(title, {
            speed: 50,
            maxIterations: 12,
            characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            stagger: true
        });
    }

    // Add a simple fade-in animation for the subtitle
    const subtitle = document.querySelector('.translator-subtitle');
    if (subtitle) {
        subtitle.style.opacity = '0';
        setTimeout(() => {
            subtitle.style.transition = 'opacity 0.5s ease';
            subtitle.style.opacity = '1';
        }, 500); // Start fade-in after 500ms
    }
}); 