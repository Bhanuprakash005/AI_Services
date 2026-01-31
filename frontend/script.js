// API URL from inline script in index.html (so cached script.js cannot use old relative /api)
var API_BASE_URL = (typeof window !== 'undefined' && window.__CONTACT_API_URL) ? window.__CONTACT_API_URL : 'https://ai-services-xkpq.onrender.com/api';

// DOM Elements
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');
const submitButton = contactForm.querySelector('.btn-submit');
const btnText = submitButton.querySelector('.btn-text');
const btnLoader = submitButton.querySelector('.btn-loader');

// Form submission handler
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        message: document.getElementById('message').value.trim(),
    };

    // Reset form message
    hideFormMessage();

    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
        showFormMessage('Please fill in all fields.', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showFormMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Disable submit button and show loading state
    setFormLoading(true);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const text = await response.text();
        let data = {};
        if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
            try {
                data = JSON.parse(text);
            } catch (_) {}
        }

        if (response.status === 502 || response.status === 503) {
            showFormMessage('Server is temporarily unavailable. Wait a minute and try again.', 'error');
            setFormLoading(false);
            return;
        }
        if (!response.ok && !data.error) {
            showFormMessage('Server returned an error. Please try again in a moment.', 'error');
            setFormLoading(false);
            return;
        }

        if (response.ok && data.success) {
            showFormMessage(data.message || 'Thank you! Your message was sent.', 'success');
            contactForm.reset();
        } else {
            showFormMessage(data.error || 'Something went wrong. Please try again.', 'error');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            showFormMessage('Request timed out. The server may be waking up—wait 30 seconds and try again.', 'error');
        } else {
            showFormMessage('Cannot reach server. Wait 30 seconds and try again (server may be starting).', 'error');
        }
        console.error('Contact form error:', error);
    } finally {
        setFormLoading(false);
    }
});

// Show form message
function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // Scroll to message
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide form message
function hideFormMessage() {
    formMessage.style.display = 'none';
    formMessage.textContent = '';
    formMessage.className = 'form-message';
}

// Set form loading state
function setFormLoading(loading) {
    if (loading) {
        submitButton.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
    } else {
        submitButton.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    });
});

// Add scroll animation on load
window.addEventListener('load', () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe service cards and feature items
    document.querySelectorAll('.service-card, .feature-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
