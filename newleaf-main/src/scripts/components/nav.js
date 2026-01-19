/**
 * Navigation Component - New Leaf
 * Logic for mobile menu toggling and active links.
 */

export function initNav() {
    const header = document.querySelector('.nl-header');
    const toggle = header?.querySelector('.nl-mobile-toggle');
    const nav = header?.querySelector('.nl-nav');
    const navLinks = header?.querySelectorAll('.nl-nav-link, .nl-btn--primary');

    if (!header || !toggle || !nav) return;

    /**
     * Toggles the mobile menu state
     * @param {boolean} force - Optional force state
     */
    const toggleMenu = (force) => {
        const isActive = force !== undefined ? force : header.getAttribute('data-nav-active') !== 'true';
        
        header.setAttribute('data-nav-active', isActive);
        toggle.setAttribute('aria-expanded', isActive);
        
        // Prevent body scroll when menu is open on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = isActive ? 'hidden' : '';
        }
    };

    // Toggle click event
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && header.getAttribute('data-nav-active') === 'true') {
            toggleMenu(false);
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        const isOutside = !header.contains(e.target);
        if (isOutside && header.getAttribute('data-nav-active') === 'true') {
            toggleMenu(false);
        }
    });

    // Handle Scroll State (Header Sticky Background)
    const handleScroll = () => {
        const scrolled = window.scrollY > 50;
        header.classList.toggle('is-scrolled', scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check on init

    // Handle Active Link State based on URL
    const updateActiveLink = () => {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath) {
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('is-active');
                link.removeAttribute('aria-current');
            }
        });
    };

    updateActiveLink();

    // Reset overflow on resize if desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.body.style.overflow = '';
            if (header.getAttribute('data-nav-active') === 'true') {
                toggleMenu(false);
            }
        }
    });
}
