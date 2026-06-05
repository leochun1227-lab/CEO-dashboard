const DATA_KEY = "portal-data";
const MAX_BODY_BYTES = 512 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Editor-Token",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!env.PORTAL_KV) {
      return json({ error: "PORTAL_KV binding is missing." }, 500);
    }

    if (request.method === "GET") {
      const stored = await env.PORTAL_KV.get(DATA_KEY);
      if (!stored) {
        return json({ error: "No portal data has been saved yet." }, 404);
      }
      return new Response(stored, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.method === "PUT" || request.method === "POST") {
      const expectedToken = env.EDITOR_TOKEN || "";
      const suppliedToken = request.headers.get("X-Editor-Token") || "";

      if (!expectedToken || suppliedToken !== expectedToken) {
        return json({ error: "Unauthorized." }, 401);
      }

      const rawBody = await request.text();
      if (rawBody.length > MAX_BODY_BYTES) {
        return json({ error: "Portal data is too large." }, 413);
      }

      let payload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return json({ error: "Request body must be valid JSON." }, 400);
      }

      const data = validatePortalData(payload);
      if (!data) {
        return json({ error: "JSON must contain a modules array." }, 400);
      }

      await env.PORTAL_KV.put(DATA_KEY, JSON.stringify(data));
      return json({ ok: true, savedAt: new Date().toISOString() });
    }

    return json({ error: "Method not allowed." }, 405);
  },
};

function validatePortalData(value) {
  if (!value || !Array.isArray(value.modules)) return null;

  return {
    modules: value.modules.map((module) => {
      const source = isObject(module) ? module : {};
      return {
        id: cleanText(source.id),
        name: cleanText(source.name),
        note: cleanText(source.note),
        links: Array.isArray(source.links)
        ? source.links.map((link) => {
            const item = isObject(link) ? link : {};
            return {
              id: cleanText(item.id),
              name: cleanText(item.name),
              url: cleanText(item.url),
              note: cleanText(item.note),
            };
          })
        : [],
      };
    }),
  };
}

function isObject(value) {
  return value !== null && typeof value === "object";
}

function cleanText(value) {
  return String(value ?? "").slice(0, 2000);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
