const HASH = "c77639710bd89eea8855346472b0eb9175987e0eaeb35df92b1712ca09215f05";

async function hash(value) {
  const bytes = new TextEncoder().encode(value || "");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const { request, env } = context;
  if (await hash(request.headers.get("X-Helen-Passcode")) !== HASH) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!env.HELEN_STATE) {
    return new Response("Storage is not connected", { status: 503 });
  }
  if (request.method === "GET") {
    const value = await env.HELEN_STATE.get("checklist");
    return value ? new Response(value, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }) : new Response("Not found", { status: 404 });
  }
  if (request.method === "PUT") {
    const body = await request.text();
    if (body.length > 2_000_000) return new Response("State is too large", { status: 413 });
    let value;
    try { value = JSON.parse(body); } catch { return new Response("Invalid JSON", { status: 400 }); }
    if (value?.schemaVersion !== 1 || !Array.isArray(value.tasks)) return new Response("Invalid state", { status: 400 });
    await env.HELEN_STATE.put("checklist", JSON.stringify(value));
    return new Response(null, { status: 204 });
  }
  return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, PUT" } });
}
