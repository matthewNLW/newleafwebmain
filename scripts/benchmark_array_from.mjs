import { performance } from 'node:perf_hooks';

// Mocking DOM elements
class MockNodeList extends Array {
    constructor(...args) {
        super(...args);
    }
}

const numCards = 1000;
const cards = new MockNodeList(numCards);
for (let i = 0; i < numCards; i++) {
    cards[i] = { id: i, classList: { add: () => {}, remove: () => {} } };
}

const targetCard = cards[numCards - 1]; // worst case scenario

const iterations = 100000;

function runBaseline() {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const currentIndex = Array.from(cards).indexOf(targetCard);
        const nextCard = cards[currentIndex + 1];
    }
    const end = performance.now();
    return end - start;
}

function runOptimized() {
    const cardsArray = Array.from(cards);
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const currentIndex = cardsArray.indexOf(targetCard);
        const nextCard = cardsArray[currentIndex + 1];
    }
    const end = performance.now();
    return end - start;
}

const baselineTime = runBaseline();
const optimizedTime = runOptimized();

console.log(`Baseline: ${baselineTime.toFixed(2)} ms`);
console.log(`Optimized: ${optimizedTime.toFixed(2)} ms`);
console.log(`Improvement: ${((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2)}%`);
