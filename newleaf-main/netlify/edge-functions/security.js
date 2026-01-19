export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

  // 1. Block sensitive file extensions
  const sensitiveExtensions = [".php", ".env", ".git", ".sql", ".bak", ".config"];
  if (sensitiveExtensions.some(ext => path.endsWith(ext))) {
    return new Response("Forbidden Access", { status: 403 });
  }

  // 2. Block aggressive bots
  const aggressiveBots = ["semrushbot", "ahrefsbot", "dotbot", "mj12bot", "petalbot", "bytespider", "liebaofast"];
  if (aggressiveBots.some(bot => userAgent.includes(bot))) {
    return new Response("Access Denied", { status: 403 });
  }

  return context.next();
};
