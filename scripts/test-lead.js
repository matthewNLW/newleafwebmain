import test from "node:test";
import assert from "node:assert";

// Mock Deno global before importing the handler
globalThis.Deno = {
  env: {
    get: (key) => {
      if (key === "TURNSTILE_SECRET") return "test-secret";
      if (key === "NOTION_TOKEN") return "test-token";
      if (key === "NOTION_DB_ID") return "test-db-id";
      return undefined;
    },
  },
};

const leadHandler = (await import("../netlify/edge-functions/lead.js")).default;

test("Lead Function - Invalid JSON body returns 400", async () => {
  const request = new Request("https://newleafweb.com/lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://newleafweb.com",
    },
    // Providing an invalid JSON string
    body: "{ invalid json }",
  });

  const context = {};
  const response = await leadHandler(request, context);

  assert.strictEqual(response.status, 400);
  const body = await response.json();
  assert.strictEqual(body.error, "Invalid Request Body");
});

test("Lead Function - Invalid FormData body returns 400", async () => {
    // This is a bit harder to trigger with standard Request because it usually validates FormData
    // but we can try to pass something that request.formData() will fail on.

    // In many environments request.formData() might fail if the body is not properly formatted.

    const request = new Request("https://newleafweb.com/lead", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data; boundary=something",
        "Origin": "https://newleafweb.com",
      },
      body: "this is not valid form data",
    });

    const context = {};
    const response = await leadHandler(request, context);

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.error, "Invalid Request Body");
});
