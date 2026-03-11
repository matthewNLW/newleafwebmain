import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { initAnimations } from './animations.js';

describe('initAnimations', () => {
    let observedElements = [];
    let unobservedElements = [];
    let observerCallback = null;
    let observerOptions = null;
    let mockRevealElements = [];
    let mockHeroElements = [];
    let originalIntersectionObserver;
    let originalDocument;

    class MockElement {
        constructor() {
            this.classes = new Set();
        }
        get classList() {
            return {
                add: (cls) => this.classes.add(cls),
                contains: (cls) => this.classes.has(cls)
            };
        }
    }

    beforeEach(() => {
        observedElements = [];
        unobservedElements = [];
        observerCallback = null;
        observerOptions = null;
        mockRevealElements = [new MockElement(), new MockElement()];
        mockHeroElements = [new MockElement()];

        originalIntersectionObserver = globalThis.IntersectionObserver;
        originalDocument = globalThis.document;

        globalThis.IntersectionObserver = class {
            constructor(callback, options) {
                observerCallback = callback;
                observerOptions = options;
            }
            observe(el) {
                observedElements.push(el);
            }
            unobserve(el) {
                unobservedElements.push(el);
            }
        };

        globalThis.document = {
            querySelectorAll: (selector) => {
                if (selector === '.reveal, .reveal--stagger') return mockRevealElements;
                if (selector === '.hero-reveal') return mockHeroElements;
                return [];
            }
        };
    });

    afterEach(() => {
        globalThis.IntersectionObserver = originalIntersectionObserver;
        globalThis.document = originalDocument;
    });

    it('should set up IntersectionObserver with correct options', () => {
        initAnimations();
        assert.deepStrictEqual(observerOptions, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
    });

    it('should observe all reveal elements', () => {
        initAnimations();
        assert.strictEqual(observedElements.length, 2);
        assert.strictEqual(observedElements[0], mockRevealElements[0]);
        assert.strictEqual(observedElements[1], mockRevealElements[1]);
    });

    it('should add "is-revealed" class and unobserve when intersecting', () => {
        initAnimations();

        // Trigger callback
        const entry = {
            isIntersecting: true,
            target: mockRevealElements[0]
        };
        observerCallback([entry]);

        assert.strictEqual(mockRevealElements[0].classes.has('is-revealed'), true);
        assert.strictEqual(unobservedElements.length, 1);
        assert.strictEqual(unobservedElements[0], mockRevealElements[0]);
    });

    it('should do nothing when not intersecting', () => {
        initAnimations();

        // Trigger callback
        const entry = {
            isIntersecting: false,
            target: mockRevealElements[0]
        };
        observerCallback([entry]);

        assert.strictEqual(mockRevealElements[0].classes.has('is-revealed'), false);
        assert.strictEqual(unobservedElements.length, 0);
    });

    it('should add "is-revealed" class to hero elements after a timeout', async () => {
        initAnimations();

        // Initially not revealed
        assert.strictEqual(mockHeroElements[0].classes.has('is-revealed'), false);

        // Wait for timeout (100ms in code, so wait 150ms)
        await new Promise(resolve => setTimeout(resolve, 150));

        // Now revealed
        assert.strictEqual(mockHeroElements[0].classes.has('is-revealed'), true);
    });

    it('should handle missing hero elements gracefully', async () => {
        // Change mock to return empty for hero
        globalThis.document.querySelectorAll = (selector) => {
            if (selector === '.reveal, .reveal--stagger') return mockRevealElements;
            return [];
        };

        // Should not throw
        initAnimations();

        // Wait for potential timeout to ensure no errors happen later
        await new Promise(resolve => setTimeout(resolve, 150));
        assert.ok(true); // if it reaches here without error, it's successful
    });
});
