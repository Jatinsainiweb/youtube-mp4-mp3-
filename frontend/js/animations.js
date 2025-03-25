document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize particle background
    initParticles();
    
    // Add loading animations to buttons
    initButtonAnimations();
    
    // Initialize progress bar
    initProgressBar();
});

// Scroll Animation Handler
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Particle Background
function initParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random positioning
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random size
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random animation duration
        particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Button Animation Handler
function initButtonAnimations() {
    const buttons = document.querySelectorAll('.download-btn, .format-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Add loading state
            button.classList.add('loading');
            
            // Remove loading state after animation
            setTimeout(() => {
                button.classList.remove('loading');
            }, 2000);
        });
    });
}

// Progress Bar Handler
function initProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (!progressBar) return;
    
    window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        
        const progress = (scrolled / documentHeight) * 100;
        progressBar.style.width = `${progress}%`;
    });
}

// Add shimmer effect to elements
function addShimmerEffect(element) {
    element.classList.add('shimmer');
    
    setTimeout(() => {
        element.classList.remove('shimmer');
    }, 2000);
}

// Add floating animation to elements
function addFloatingEffect(element) {
    element.classList.add('floating');
}

// Add glass morphism effect
function addGlassEffect(element) {
    element.classList.add('glass');
}

// Handle dark mode toggle
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark-mode'));
}

// Check system dark mode preference
function checkSystemDarkMode() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark-mode');
    }
    
    // Listen for system dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    });
}

// Initialize hover effects
function initHoverEffects() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.classList.add('hover-card');
    });
}

// Add gradient text effect
function addGradientTextEffect(element) {
    element.classList.add('gradient-text');
}

// Initialize all animations
function initAllAnimations() {
    checkSystemDarkMode();
    initHoverEffects();
    
    // Add gradient text to headings
    document.querySelectorAll('h1, h2').forEach(heading => {
        addGradientTextEffect(heading);
    });
    
    // Add glass effect to converter box
    const converterBox = document.querySelector('.converter-box');
    if (converterBox) {
        addGlassEffect(converterBox);
    }
    
    // Add floating effect to feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        setTimeout(() => {
            addFloatingEffect(card);
        }, index * 200);
    });
}
