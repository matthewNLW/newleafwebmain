import { test } from 'node:test';
import assert from 'node:assert';
import leadHandler from '../netlify/edge-functions/lead.js';

// Mock Deno global
globalThis.Deno = {
  env: {
    get: (key) => {
      if (key === 'TURNSTILE_SECRET') return 'dummy_secret';
      if (key === 'NOTION_TOKEN') return 'dummy_token';
      if (key === 'NOTION_DB_ID') return 'dummy_db_id';
      return null;
    }
  }
};

// Mock fetch for Turnstile and Notion
globalThis.fetch = async (url) => {
  if (url.includes('turnstile')) {
    return new Response(JSON.stringify({ success: true }));
  }
  if (url.includes('notion')) {
    return new Response(JSON.stringify({ ok: true }));
  }
  return new Response();
};

test('lead.js prioritizes x-nf-client-connection-ip over CF-Connecting-IP', async () => {
  // Test case 1: Both headers present, x-nf should be used
  const req1 = new Request('https://newleafweb.com/lead', {
    method: 'POST',
    headers: {
      'Origin': 'https://newleafweb.com',
      'x-nf-client-connection-ip': '1.2.3.4',
      'CF-Connecting-IP': '5.6.7.8',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test',
      email: 'test@example.com',
      token: 'dummy_token'
    })
  });

  // Since we can't easily assert the internal IP variable directly,
  // we can mock fetch to intercept the Turnstile verification call
  // which includes the IP address.
  let turnstileBody = '';
  globalThis.fetch = async (url, options) => {
    if (url.includes('turnstile')) {
      turnstileBody = options.body.toString();
      return new Response(JSON.stringify({ success: true }));
    }
    if (url.includes('notion')) {
      return new Response(JSON.stringify({ ok: true }));
    }
    return new Response();
  };

  await leadHandler(req1, {});

  // The IP sent to turnstile should be the x-nf one
  assert.ok(turnstileBody.includes('remoteip=1.2.3.4'), `Expected IP 1.2.3.4 in turnstile body, got ${turnstileBody}`);

  // Test case 2: Only CF header present
  const req2 = new Request('https://newleafweb.com/lead', {
    method: 'POST',
    headers: {
      'Origin': 'https://newleafweb.com',
      'CF-Connecting-IP': '5.6.7.8',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test',
      email: 'test@example.com',
      token: 'dummy_token'
    })
  });

  await leadHandler(req2, {});

  assert.ok(turnstileBody.includes('remoteip=5.6.7.8'), `Expected IP 5.6.7.8 in turnstile body, got ${turnstileBody}`);
});
