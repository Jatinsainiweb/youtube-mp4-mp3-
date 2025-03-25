// API endpoints
const API_BASE_URL = 'https://youtube-mp4-mp3-backend.onrender.com/api';

// Function to load navigation menu
async function loadNavigation() {
    try {
        const response = await fetch(`${API_BASE_URL}/pages`);
        const pages = await response.json();
        
        const navLinks = document.querySelector('.nav-links');
        navLinks.innerHTML = `
            <li><a href="youtube-mp4-converter.html" class="nav-link">Home</a></li>
            ${pages
                .filter(page => page.path !== 'youtube-mp4-converter.html' && page.path !== 'index.html')
                .map(page => `
                    <li><a href="${page.path}" class="nav-link">${page.name}</a></li>
                `).join('')}
        `;
    } catch (error) {
        console.error('Failed to load navigation:', error);
    }
}

// Function to load FAQs
async function loadFAQs() {
    const faqSection = document.querySelector('#faq-section');
    if (!faqSection) return;

    try {
        const response = await fetch(`${API_BASE_URL}/faqs`);
        const faqs = await response.json();
        
        faqSection.innerHTML = faqs.map(faq => `
            <div class="faq-item">
                <h3>${faq.question}</h3>
                <p>${faq.answer}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load FAQs:', error);
    }
}

// Function to handle contact form submission
async function handleContactSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData)),
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Message sent successfully!');
            form.reset();
        } else {
            alert('Failed to send message. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('An error occurred. Please try again later.');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadNavigation();
    loadFAQs();
    
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }
});
