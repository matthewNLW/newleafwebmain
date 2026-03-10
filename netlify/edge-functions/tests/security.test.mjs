import test from "node:test";
import assert from "node:assert";
import security from "../security.js";

// Utility to create a mock Request
const createMockRequest = ({ url = "https://example.com/", userAgent = "", clientIp = "127.0.0.1" } = {}) => {
  return new Request(url, {
    headers: {
      "user-agent": userAgent,
      "x-nf-client-connection-ip": clientIp,
    },
  });
};

// Utility to create a mock context
const createMockContext = () => {
  let nextCalled = false;
  return {
    get nextCalled() { return nextCalled; },
    next: async () => {
      nextCalled = true;
      return new Response("OK", {
        status: 200,
        headers: new Headers(),
      });
    },
  };
};

test("Security Edge Function", async (t) => {

  await t.test("blocks sensitive file extensions with 403", async () => {
    const sensitiveExtensions = [".php", ".env", ".git", ".sql", ".bak", ".config", ".ini", ".sh"];

    for (const ext of sensitiveExtensions) {
      const request = createMockRequest({ url: `https://example.com/secret${ext}` });
      const context = createMockContext();

      const response = await security(request, context);

      assert.strictEqual(response.status, 403);
      const text = await response.text();
      assert.strictEqual(text, "Forbidden Access");
      assert.strictEqual(context.nextCalled, false, `context.next() should not be called for ${ext}`);
    }
  });

  await t.test("allows non-sensitive file extensions", async () => {
    const allowedExtensions = [".html", ".css", ".js", ".png", ".jpg"];

    for (const ext of allowedExtensions) {
      const request = createMockRequest({ url: `https://example.com/public${ext}` });
      const context = createMockContext();

      const response = await security(request, context);

      assert.strictEqual(response.status, 200);
      assert.strictEqual(context.nextCalled, true, `context.next() should be called for ${ext}`);
      assert.strictEqual(response.headers.get("X-RateLimit-Limit"), "1000");
    }
  });

  await t.test("blocks aggressive bots with 403", async () => {
    const aggressiveBots = [
      "semrushbot", "ahrefsbot", "dotbot", "mj12bot", "petalbot", "bytespider", "liebaofast",
      "gptbot", "ccbot", "claudebot", "anthropic-ai"
    ];

    for (const bot of aggressiveBots) {
      const request = createMockRequest({
        url: "https://example.com/",
        userAgent: `Mozilla/5.0 (compatible; ${bot}/1.0)`
      });
      const context = createMockContext();

      const response = await security(request, context);

      assert.strictEqual(response.status, 403);
      const text = await response.text();
      assert.strictEqual(text, "Access Denied: Automated traffic not permitted.");
      assert.strictEqual(context.nextCalled, false, `context.next() should not be called for ${bot}`);
    }
  });

  await t.test("allows normal user agents", async () => {
    const request = createMockRequest({
      url: "https://example.com/",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    });
    const context = createMockContext();

    const response = await security(request, context);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(context.nextCalled, true, "context.next() should be called for normal user agent");
  });

  await t.test("appends rate limit headers to successful responses", async () => {
    const request = createMockRequest({ url: "https://example.com/" });
    const context = createMockContext();

    const response = await security(request, context);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get("X-RateLimit-Limit"), "1000");
    assert.strictEqual(response.headers.get("X-RateLimit-Remaining"), "999");
  });

  await t.test("handles requests without user-agent header", async () => {
    const request = new Request("https://example.com/");
    const context = createMockContext();

    const response = await security(request, context);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(context.nextCalled, true);
  });
});
