// Simple in-memory rate limit map (clears on function restart/cold boot)
// Note: For distributed persistence, consider using Netlify Blobs or a KV store.
const rateLimitMap = new Map();

export default async (request, context) => {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = new Set([
    "https://newleafweb.com",
    "https://www.newleafweb.com",
    "http://localhost:8888" // Allow local testing
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
    console.error(`[Lead Error] Invalid Method: ${request.method} from ${origin}`);
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // Rate Limiting (Simple IP-based)
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-nf-client-connection-ip") || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const limit = 5; // 5 requests per minute

  if (rateLimitMap.has(ip)) {
    const { count, startTime } = rateLimitMap.get(ip);
    if (now - startTime < windowMs) {
      if (count >= limit) {
        console.error(`[Lead Warining] Rate limit exceeded for IP: ${ip}`);
        return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), { 
            status: 429, 
            headers: corsHeaders 
        });
      }
      rateLimitMap.set(ip, { count: count + 1, startTime });
    } else {
      rateLimitMap.set(ip, { count: 1, startTime: now });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, startTime: now });
  }

  // Cleanup old entries periodically (simple approach) or let them expire naturally on cold start
  if (rateLimitMap.size > 1000) rateLimitMap.clear();


  // Parse body (JSON)
  let data = {};
  const contentType = request.headers.get("Content-Type") || "";

  try {
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    }
  } catch (e) {
    console.error(`[Lead Error] Invalid Request Body from ${ip}`);
    return new Response(JSON.stringify({ error: "Invalid Request Body" }), { status: 400, headers: corsHeaders });
  }

  // --- VALIDATION & SANITIZATION ---
  const sanitize = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim(); // Basic HTML escape
  };

  const name = sanitize(data.name);
  const email = sanitize(data.email);
  const business = sanitize(data.company || data.business);
  const service = sanitize(data.service);
  const budget = sanitize(data.budget);
  const phone = sanitize(data.phone);
  const message = sanitize(data.message);
  const sourcePage = sanitize(data.page);
  const branding = sanitize(data.branding);
  const timeline = sanitize(data.timeline);
  const pages = sanitize(data.pages);

  // Validate Required Fields
  if (!name || name.length > 100) {
    return new Response(JSON.stringify({ error: "Invalid name provided." }), { status: 400, headers: corsHeaders });
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    return new Response(JSON.stringify({ error: "Invalid email address." }), { status: 400, headers: corsHeaders });
  }

  // --- END VALIDATION ---


  // Get Token
  const token = data["cf-turnstile-response"] || data["turnstileToken"] || data["token"] || "";

  if (!token) {
    console.error(`[Lead Error] Missing Turnstile token from ${ip}`);
    return new Response(
      JSON.stringify({ error: "Missing Turnstile token" }),
      { status: 403, headers: corsHeaders }
    );
  }

  // 1. Verify with Turnstile
  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET");

  if (!turnstileSecret) {
    console.error(`[Lead Fatal] TURNSTILE_SECRET is not set.`);
    return new Response(JSON.stringify({ error: "Server Configuration Error" }), { 
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
    console.error(`[Lead Error] Turnstile Failed for ${ip}:`, verify['error-codes']);
    return new Response(
      JSON.stringify({ error: "Turnstile Verification Failed", details: verify }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Send to Notion
  const notionToken = Deno.env.get("NOTION_TOKEN");
  const notionDbId = Deno.env.get("NOTION_DB_ID");

  if (!notionToken || !notionDbId) {
     console.error(`[Lead Warning] Notion not configured. Data received but not saved.`);
     return new Response(JSON.stringify({ ok: true, warning: "Lead saved locally (mock)" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
  }

  try {
    // --- MAPPING VALUES TO NOTION OPTIONS ---
    // Maps form values to the Exact text found in Notion Select options to prevent new tag creation or errors
    
    const serviceMap = {
        "business": "Business / Service Website",
        "ecommerce": "Ecommerce",
        "booking": "Booking",
        "portfolio": "Portfolio",
        "unsure": "Other"
    };

    const budgetMap = {
        "1000-2500": "$1k–$2.5k",
        "2500-5000": "$2.5k–$5k",
        "5000+": "$5k+",
        "unsure": "Not sure"
    };

    const timelineMap = {
        "asap": "ASAP",
        "1-2weeks": "1–2 weeks", // Note the specific dash/spacing if matching Notion
        "3-4weeks": "3–4 weeks",
        "flexible": "Flexible"
    };

    // Use mapped value, or fallback to original capitalized, or "Unsure"
    const finalService = serviceMap[service] || service || "Other";
    const finalBudget = budgetMap[budget] || budget || "Not sure";
    const finalTimeline = timelineMap[timeline] || timeline || "Flexible";


    const notionPayload = {
      parent: { database_id: notionDbId },
      properties: {
        "Name": {
          title: [
            { text: { content: business || name || "New Website Lead" } }
          ]
        },
        "Client Name": {
          rich_text: [ { text: { content: name } } ]
        },
        "Business Name": {
          rich_text: [ { text: { content: business } } ]
        },
        "Client Email": {
          email: email
        },
        "Client Phone": {
            phone_number: phone || null
        },
        "Website Type": {
           select: { name: finalService }
        },
        "Budget Range": {
           select: { name: finalBudget }
        },
        "Timeline": {
           select: { name: finalTimeline }
        },
        "Deal Status": {
            select: { name: "New (Form Submitted)" }
        },
        "Lead Source": {
            select: { name: "Inbound" }
        }
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
            rich_text: [{ text: { content: message || "No additional details provided." } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: `Pages: ${pages}\nBranding: ${branding}` } }]
          }
        },
        {
             object: "block",
             type: "paragraph",
             paragraph: {
                 rich_text: [{ text: { content: `Source Path: ${sourcePage}` } }]
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
        console.error(`[Lead Error] Notion API Failed:`, notionErr);
    } else {
        console.log(`[Lead Success] New lead created for: ${email}`);
    }

  } catch (err) {
      console.error(`[Lead Exception]`, err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};
