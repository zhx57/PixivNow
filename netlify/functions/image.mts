export default async (req: Request) => {
  const url = new URL(req.url);
  const params = url.searchParams;
  let prefix = params.get("__PREFIX");
  let path = params.get("__PATH");

  // Fallback: Manually parse path if rewrite params are missing
  // This mimics the logic in utils/adapter.ts
  if (!prefix || !path) {
    const pathname = url.pathname;
    if (pathname.startsWith("/-/")) {
      prefix = "-";
      path = pathname.substring(3);
    } else if (pathname.startsWith("/~/")) {
      prefix = "~";
      path = pathname.substring(3);
    }
  }

  if (!prefix || !path) {
    return new Response("Missing param(s)", { status: 400 });
  }

  let targetHostname = "";
  if (prefix === "-") {
    targetHostname = "i.pximg.net";
  } else if (prefix === "~") {
    targetHostname = "s.pximg.net";
  } else {
    return new Response("Invalid request", { status: 400 });
  }

  const targetUrl = new URL(`https://${targetHostname}/${path}`);

  // Create headers
  const headers = new Headers(req.headers);
  headers.set("Referer", "https://www.pixiv.net/");
  headers.set("User-Agent", "Cloudflare Workers");
  // Ensure Host header is not set to the proxy's host, let fetch handle it or set it to target
  headers.set("Host", targetHostname);

  const init: RequestInit = {
    method: req.method,
    headers: headers,
    redirect: "follow",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  try {
    const response = await fetch(targetUrl.toString(), init);
    
    // Return response directly
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new Response(String(error), { status: 500 });
  }
};