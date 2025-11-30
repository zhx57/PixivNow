import { Context } from "@netlify/functions";
import { parse } from "cookie";

export const vercelToNetlifyAdapter = (
  handler: (req: any, res: any) => Promise<any>
) => {
  return async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());

    // Fallback: Manually parse path if rewrite params are missing
    if (!query.__PREFIX) {
        const path = url.pathname;
        if (path.startsWith('/~/')) {
            query.__PREFIX = '~';
            query.__PATH = path.substring(3);
        } else if (path.startsWith('/-/')) {
            query.__PREFIX = '-';
            query.__PATH = path.substring(3);
        } else if (path.startsWith('/ajax/')) {
            query.__PREFIX = 'ajax';
            query.__PATH = path.substring(6);
        } else if (path.startsWith('/rpc/')) {
            query.__PREFIX = 'rpc';
            query.__PATH = path.substring(5);
        } else if (path.endsWith('/ranking.php')) {
            query.__PREFIX = 'ranking.php';
        } else if (path.endsWith('/bookmark_add.php')) {
            query.__PREFIX = 'bookmark_add.php';
        } else if (path.endsWith('/rpc_group_setting.php')) {
            query.__PREFIX = 'rpc_group_setting.php';
        }
    }

    const cookies = parse(req.headers.get("cookie") || "");

    // Parse body if present
    let body = null;
    if (req.body) {
        try {
            const contentType = req.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                body = await req.json();
            } else {
                body = await req.text();
            }
        } catch (e) {
            // Ignore parsing errors, body might be null or handled differently
        }
    }

    // Mock VercelRequest
    const vReq = {
      query,
      cookies,
      headers: Object.fromEntries(req.headers.entries()),
      method: req.method,
      body,
      url: req.url,
    };

    // Mock VercelResponse
    let statusCode = 200;
    let headers: Record<string, string> = {};
    let responseBody: any = null;

    const vRes = {
      status: (code: number) => {
        statusCode = code;
        return vRes;
      },
      send: (data: any) => {
        responseBody = data;
        return vRes;
      },
      json: (data: any) => {
        headers["content-type"] = "application/json";
        responseBody = JSON.stringify(data);
        return vRes;
      },
      setHeader: (key: string, value: string) => {
        headers[key.toLowerCase()] = value;
        return vRes;
      },
      redirect: (url: string) => {
        statusCode = 302;
        headers["location"] = url;
        return vRes;
      },
    };

    try {
      await handler(vReq, vRes);
    } catch (e: any) {
        console.error("Function execution error:", e);
        return new Response(JSON.stringify({ message: e.message || "Internal Server Error" }), { 
            status: 500,
            headers: { "content-type": "application/json" } 
        });
    }

    // Handle response body
    let finalBody: BodyInit | null = null;
    if (responseBody !== null && responseBody !== undefined) {
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(responseBody)) {
            finalBody = responseBody;
        } else if (typeof responseBody === 'object') {
            finalBody = JSON.stringify(responseBody);
             if (!headers['content-type']) {
                headers['content-type'] = 'application/json';
            }
        } else {
            finalBody = String(responseBody);
        }
    }

    return new Response(finalBody, {
      status: statusCode,
      headers,
    });
  };
};
