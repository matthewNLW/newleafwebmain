import { initNav } from '../src/scripts/components/nav.js';

// Mock DOM
const mockHeaderClassList = {
    classes: new Set(),
    toggle: function(className, force) {
        if (force) {
            this.classes.add(className);
        } else {
            this.classes.delete(className);
        }
    }
};

const mockHeader = {
    querySelector: () => ({ setAttribute: () => {}, addEventListener: () => {} }),
    querySelectorAll: () => [],
    getAttribute: () => 'false',
    setAttribute: () => {},
    classList: mockHeaderClassList,
    contains: () => false
};

const documentMock = {
    querySelector: () => mockHeader,
    addEventListener: () => {},
    body: { style: {} }
};

const windowMock = {
    innerWidth: 1000,
    scrollY: 0,
    addEventListener: function(event, callback) {
        if (event === 'scroll') {
            this.scrollCallback = callback;
        }
    },
    location: { pathname: '/test' },
    requestAnimationFrame: (callback) => {
        global.animationFrameCount++;
        // Do not execute immediately! Just queue it.
        // We will execute it once to simulate one frame processing.
        global.pendingFrame = callback;
        return 1;
    }
};

// Global overrides
global.document = documentMock;
global.window = windowMock;

// Animation Frame Mocking
global.animationFrameCount = 0;
global.requestAnimationFrame = windowMock.requestAnimationFrame;

// Start component
initNav();

// Benchmark
const iterations = 10000;
const start = performance.now();

// Intercept toggle calls to count executions
let executions = 0;
const originalToggle = mockHeaderClassList.toggle;
mockHeaderClassList.toggle = function(className, force) {
    executions++;
    originalToggle.call(this, className, force);
};

// Reset execution counter (init call happens before we overwrite toggle)
executions = 0;

for (let i = 0; i < iterations; i++) {
    windowMock.scrollY = i % 100; // simulate scroll change
    if (windowMock.scrollCallback) {
        windowMock.scrollCallback(); // calls handleScroll
    }
    // Simulate browser painting frame after some scroll events
    if (i % 100 === 0 && global.pendingFrame) {
        global.pendingFrame();
        global.pendingFrame = null;
    }
}

// Drain last frame if any
if (global.pendingFrame) {
    global.pendingFrame();
    global.pendingFrame = null;
}

const end = performance.now();
const time = end - start;

console.log(`Scroll events fired: ${iterations}`);
console.log(`handleScroll executions (DOM updates): ${executions}`);
console.log(`Time taken: ${time.toFixed(2)}ms`);
