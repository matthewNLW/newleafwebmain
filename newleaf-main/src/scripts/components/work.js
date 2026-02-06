
/**
 * Work Page Interactions
 * Handles the "Reading Mode" state for case study cards.
 */

export function initWorkInteractions() {
    const cards = document.querySelectorAll('.nl-deck-card');
    const viewButtons = document.querySelectorAll('.nl-case-overlay-btn, .nl-mobile-case-btn');
    const closeButtons = document.querySelectorAll('.nl-close-case-btn');
    const nextButtons = document.querySelectorAll('.nl-next-case-btn');

    function openCase(card) {
        if (!card) return;
        
        // Lock body scroll
        document.body.classList.add('is-reading-case');
        
        // Reset internal scroll position
        const scrollContainer = card.querySelector('.nl-case-scroll');
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
        
        card.classList.add('is-reading');
    }

    function closeCase(card) {
        if (!card) return;
        
        card.classList.remove('is-reading');
        document.body.classList.remove('is-reading-case');
        
        // Scroll back to card top for context
        const cardTop = card.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: cardTop, behavior: 'smooth' });
    }

    // Event: View Case Study
    viewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.nl-deck-card');
            openCase(card);
        });
    });

    // Event: Close Case Study
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.nl-deck-card');
            closeCase(card);
        });
    });

    // Event: Next Case Study
    nextButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentCard = btn.closest('.nl-deck-card');
            const currentIndex = Array.from(cards).indexOf(currentCard);
            const nextCard = cards[currentIndex + 1];

            if (nextCard) {
                // Close current view
                currentCard.classList.remove('is-reading');
                document.body.classList.remove('is-reading-case');
                
                // Scroll to the next card's preview location
                const nextTop = nextCard.getBoundingClientRect().top + window.pageYOffset - 120;
                window.scrollTo({ top: nextTop, behavior: 'smooth' });
            } else {
                // No more cards, just close and stay at bottom
                closeCase(currentCard);
            }
        });
    });
}



