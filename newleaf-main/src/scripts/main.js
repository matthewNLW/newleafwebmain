/**
 * Main Scripts - New Leaf
 * Core initialization for the site.
 */

import { initNav } from './components/nav.js';
import { initProcessStepper } from './components/process.js';
import { initAnimations, initServicesInteractions, initContactForm, initExploreInteractions } from './components/animations.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Navigation
    initNav();

    // Initialize Process Stepper
    initProcessStepper();

    // Initialize Animations & Interactions
    initAnimations();
    initServicesInteractions();
    initContactForm();
    initExploreInteractions();

    console.log('New Leaf digital experience initialized.');
});
