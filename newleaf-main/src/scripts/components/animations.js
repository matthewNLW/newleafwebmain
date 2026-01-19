/**
 * Animations Component - New Leaf
 * Handles scroll reveals, hero entrances, and specialized interactions.
 */

export const initAnimations = () => {
    // 1. Scroll Reveal IntersectionObserver
    const revealOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                // stop observing once revealed
                revealObserver.unobserve(entry.target);
            }
        });
    }, revealOptions);

    const revealElements = document.querySelectorAll('.reveal, .reveal--stagger');
    revealElements.forEach(el => revealObserver.observe(el));

    // 2. Hero Entrance (Trigger on load)
    const heroElements = document.querySelectorAll('.hero-reveal');
    if (heroElements.length > 0) {
        // Small timeout to ensure browser has painted
        setTimeout(() => {
            heroElements.forEach(el => el.classList.add('is-revealed'));
        }, 100);
    }
};

/**
 * Services Interactions
 * Handles hover effects and progressive disclosure.
 */
export const initServicesInteractions = () => {
    const serviceItems = document.querySelectorAll('.nl-service-item');
    
    serviceItems.forEach(item => {
        // Toggle Active State (Progressive Disclosure)
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('is-active');
            
            // Close others
            serviceItems.forEach(other => other.classList.remove('is-active'));
            
            // Toggle current
            if (!isActive) {
                item.classList.add('is-active');
            }
        });
    });
};

/**
 * Contact Form Logic
 * Simple feedback simulation.
 */
export const initContactForm = () => {
    const form = document.querySelector('.nl-contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const feedback = document.querySelector('.nl-form-feedback');
        
        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            form.reset();
            
            if (feedback) {
                feedback.classList.add('is-visible');
            }
        }, 1500);
    });
};

/**
 * Explore Page Interactions
 * Handles theme detail expansion.
 */
export const initExploreInteractions = () => {
    const toggles = document.querySelectorAll('.nl-details-toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            const target = document.getElementById(targetId);
            
            if (target) {
                const isActive = target.classList.contains('is-active');
                
                // Toggle current
                target.classList.toggle('is-active');
                toggle.textContent = isActive ? 'View style details' : 'Close details';
            }
        });
    });
};
