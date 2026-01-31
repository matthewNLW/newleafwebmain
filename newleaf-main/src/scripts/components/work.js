
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
            const card = btn.closest('.nl-deck-card');
            if (card) {
                card.classList.add('is-reading');
                document.body.classList.add('is-reading-case');
            }
        });
    });

    // Close Case Study
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.nl-deck-card');
            if (card) {
                card.classList.remove('is-reading');
                document.body.classList.remove('is-reading-case');
            }
        });
    });
}
