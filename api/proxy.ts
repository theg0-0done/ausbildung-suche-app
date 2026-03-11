export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      },
    });
  }

  const url = new URL(req.url);
  // Strip the /api prefix and forward the rest to the Arbeitsagentur API
  const apiPath = url.pathname.replace(/^\/api/, "");
  const targetUrl = `https://rest.arbeitsagentur.de${apiPath}${url.search}`;

  const headers = new Headers(req.headers);
  headers.set("X-API-Key", "jobboerse-jobsuche");
  headers.delete("host");

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Proxy request failed", details: String(error) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
