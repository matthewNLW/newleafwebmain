
/**
 * Work Page Interactions
 * Handles the "Reading Mode" state for case study cards.
 */

export function initWorkInteractions() {
    const viewButtons = document.querySelectorAll('.nl-case-overlay-btn, .nl-mobile-case-btn');
    const closeButtons = document.querySelectorAll('.nl-close-case-btn');

    // Open Case Study
    viewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            let cardMedia = btn.closest('.nl-deck-media');
            
            // If button is outside media (mobile button), find the media via parent card
            if (!cardMedia) {
                const card = btn.closest('.nl-deck-card');
                if (card) {
                    cardMedia = card.querySelector('.nl-deck-media');
                }
            }

            if (cardMedia) {
                cardMedia.classList.add('is-reading');
                // Ensure the user sees the opened case study (UX for mobile)
                cardMedia.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Close Case Study
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cardMedia = btn.closest('.nl-deck-media');
            if (cardMedia) {
                cardMedia.classList.remove('is-reading');
            }
        });
    });
}
