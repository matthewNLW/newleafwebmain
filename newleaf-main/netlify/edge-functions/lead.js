export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = new Set([
      "https://newleafweb.com",
      "https://www.newleafweb.com",
      // add your Netlify preview domain if you test there
    ]);

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://newleafweb.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/lead") {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    // Parse body (JSON or form)
    // Parse body (JSON or form)
    let token = "";

    const contentType = request.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      token =
        body["cf-turnstile-response"] ||
        body["turnstileToken"] ||
        body["token"] ||
        "";
    } else {
      const form = await request.formData().catch(() => null);
      token = form?.get("cf-turnstile-response")?.toString() || "";
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing Turnstile token" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Verify with Turnstile
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });

    const verify = await verifyRes.json();
    if (!verify.success) {
      return new Response(
        JSON.stringify({
          error: "Turnstile failed",
          details: verify
        }, null, 2),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // ...continue with your lead logic...
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
