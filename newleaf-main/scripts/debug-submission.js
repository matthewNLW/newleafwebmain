
// Native fetch is available in modern Node.js versions
const LEAD_ENDPOINT = "http://localhost:8888/lead";

// We need to Bypass Turnstile for local test ideally, or we will fail.
// Wait, the Edge Function enforces Turnstile.
// I will temporarily patch the Edge Function to allow a "MAGIC TEST TOKEN" if I am debugging.
// But first, let's try to hit it and see if we can get a meaningful error.

async function testSubmit() {
    console.log("Submitting Mock Form...");
    
    // This token will fail validation unless we possess a valid one or bypass it.
    // For specific debugging, we rely on the function environment returning 
    // "Turnstile Verification Failed" which proves we hit the endpoint.
    // BUT we want to test NOTION failure.
    // So we need to Bypass Turnstile validation in the code or have a valid token.
    
    // Strategy: I will temporarily COMMENT OUT the Turnstile block in lead.js or add a bypass check for 'localhost'.
    // Actually, I'll assume the user might have run it locally.
    
    // Let's assume we can't test fully without a valid token.
    // I entered a dummy token.
    const payload = {
        name: "Test User",
        email: "test@example.com",
        business: "Test Business Inc",
        service: "business",
        budget: "1000-2500",
        timeline: "asap",
        message: "This is a debug submission.",
        "cf-turnstile-response": "DEBUG_BYPASS" 
    };

    try {
        const res = await fetch(LEAD_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log(`\nStatus: ${res.status}`);
        console.log("Response Body:");
        try {
            console.log(JSON.stringify(JSON.parse(text), null, 2));
        } catch(e) {
            console.log(text);
        }
    } catch (e) {
        console.error("Connection Failed. Is 'netlify dev' running?", e.message);
    }
}

testSubmit();
