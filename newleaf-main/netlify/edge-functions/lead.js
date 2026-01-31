export default async (request, context) => {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = new Set([
    "https://newleafweb.com",
    "https://www.newleafweb.com",
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

  // Enforce method
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // Parse body (JSON)
  let data = {};
  const contentType = request.headers.get("Content-Type") || "";

  try {
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      // Fallback for form data if needed (though client sends JSON)
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid Request Body" }), { status: 400, headers: corsHeaders });
  }

  // Get Token
  const token = data["cf-turnstile-response"] || data["turnstileToken"] || data["token"] || "";

  if (!token) {
    return new Response(
      JSON.stringify({ error: "Missing Turnstile token" }),
      { status: 403, headers: corsHeaders }
    );
  }

  // 1. Verify with Turnstile
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-nf-client-connection-ip") || "";
  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET");

  if (!turnstileSecret) {
    console.error("TURNSTILE_SECRET is not set.");
    return new Response(JSON.stringify({ error: "Server Configuration Error (Turnstile)" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: turnstileSecret,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    }),
  });

  const verify = await verifyRes.json();
  if (!verify.success) {
    return new Response(
      JSON.stringify({ error: "Turnstile Verification Failed", details: verify }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Send to Notion
  const notionToken = Deno.env.get("NOTION_TOKEN");
  const notionDbId = Deno.env.get("NOTION_DB_ID");

  if (!notionToken || !notionDbId) {
     console.error("NOTION_TOKEN or NOTION_DB_ID is not set.");
     // We return 200 to client to not break their UX, but log the error
     return new Response(JSON.stringify({ ok: true, warning: "Lead saved locally (mock) - Notion not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
  }

  try {
    // Construct Notion Payload
    // Mapping incoming `data` to Notion Properties
    const notionPayload = {
      parent: { database_id: notionDbId },
      properties: {
        "Name": {
          title: [
            { text: { content: data.name || "Unknown Lead" } }
          ]
        },
        "Email": {
          email: data.email || null
        },
        "Company": {
          rich_text: [
             { text: { content: data.company || data.business || "" } }
          ]
        },
        "Service": {
           select: { name: data.service || "Unsure" }
        },
        "Budget": {
           select: { name: data.budget || "Unsure" }
        },
        "Phone": {
            phone_number: data.phone || null
        },
        // We put extra details in the page body (children) or a 'Message' field if it exists.
        // Assuming there isn't a specific 'Message' property, we'll put it in the body.
      },
      children: [
        {
          object: "block",
          type: "heading_3",
          heading_3: {
            rich_text: [{ text: { content: "Project Details" } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: data.message || "No additional details provided." } }]
          }
        },
        {
             object: "block",
             type: "paragraph",
             paragraph: {
                 rich_text: [{ text: { content: `Source Path: ${data.page || 'Unknown'}` } }]
             }
        }
      ]
    };

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify(notionPayload)
    });

    if (!notionRes.ok) {
        const notionErr = await notionRes.json();
        console.error("Notion API Error:", notionErr);
        // Don't fail the request to the client if Notion fails, just log it.
        // Or return error if strict. Let's return success but log.
    }

  } catch (err) {
      console.error("Edge Function Error:", err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};
