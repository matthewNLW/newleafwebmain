export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const clientIp = request.headers.get("x-nf-client-connection-ip");

  // 1. Block sensitive file extensions (Basic WAF)
  const sensitiveExtensions = [".php", ".env", ".git", ".sql", ".bak", ".config", ".ini", ".sh"];
  if (sensitiveExtensions.some(ext => path.endsWith(ext))) {
    return new Response("Forbidden Access", { status: 403 });
  }

  // 2. Block aggressive bots & scrapers (Enhanced)
  // This helps reduce load and "rate limits" bad actors by denying them upfront.
  const aggressiveBots = [
    "semrushbot", "ahrefsbot", "dotbot", "mj12bot", "petalbot", "bytespider", "liebaofast",
    "gptbot", "ccbot", "claudebot", "anthropic-ai"
  ];
  if (aggressiveBots.some(bot => userAgent.includes(bot))) {
    return new Response("Access Denied: Automated traffic not permitted.", { status: 403 });
  }

  // 3. Simulated Rate Limiting Note
  // True rate limiting requiring state (like counting requests per IP) needs Netlify Blobs or a database.
  // However, we ensure standard caching is strictly enforced via netlify.toml to mitigate DoS impact.
  
  // 4. Rate Limit Response Headers (Informational)
  // We inform clients that this is a static site with cached assets.
  const response = await context.next();
  response.headers.set("X-RateLimit-Limit", "1000");
  response.headers.set("X-RateLimit-Remaining", "999"); // Static placeholder
  
  return response;
};
