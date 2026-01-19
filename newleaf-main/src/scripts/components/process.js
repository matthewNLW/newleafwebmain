/**
 * Process Component
 * Handles scroll-spy navigation and intersection animations for the Process page.
 */

export const initProcessStepper = () => {
    const processLayout = document.querySelector('.nl-process-layout');
    if (!processLayout) return;

    const navLinks = processLayout.querySelectorAll('.nl-process-nav-link');
    const stepBlocks = processLayout.querySelectorAll('.nl-step-block');
    let isScrolling = false;

    /**
     * Update active state of navigation
     */
    const updateActiveNav = (stepId) => {
        navLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${stepId}`;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'step');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    /**
     * Smooth scroll to section
     */
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                isScrolling = true;
                updateActiveNav(targetId);
                
                window.scrollTo({
                    top: targetElement.offsetTop - 120, // offset for sticky header
                    behavior: 'smooth'
                });

                // Reset scrolling flag after animation
                setTimeout(() => {
                    isScrolling = false;
                }, 1000);
            }
        });
    });

    /**
     * Intersection Observer for Scroll-Spy
     */
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px', // Trigger when section is in top portion of viewport
        threshold: 0
    };

    const spyObserver = new IntersectionObserver((entries) => {
        if (isScrolling) return; // Don't snap active state if we are currently smooth-scrolling from a click

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stepId = entry.target.id;
                updateActiveNav(stepId);
                
                // Add appearance animation class
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    stepBlocks.forEach(block => spyObserver.observe(block));

    /**
     * Header Scroll Effect Integration
     * (Ensuring the navigation links work well with the site's sticky header)
     */
    window.addEventListener('scroll', () => {
        // Optional: extra scroll logic if needed
    }, { passive: true });
};
