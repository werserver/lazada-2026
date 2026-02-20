const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTS_URL = "https://ga.passio.eco/api/v3/products";

function validateParams(body: unknown): { valid: true; data: Record<string, string> } | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Invalid request body" };
  const b = body as Record<string, unknown>;
  const data: Record<string, string> = {};

  const limit = Number(b.limit ?? 20);
  const page = Number(b.page ?? 1);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return { valid: false, error: "Invalid limit" };
  if (!Number.isInteger(page) || page < 1 || page > 10000) return { valid: false, error: "Invalid page" };
  data.limit = String(limit);
  data.page = String(page);

  if (b.keyword != null) {
    if (typeof b.keyword !== "string" || b.keyword.length > 200) return { valid: false, error: "Invalid keyword" };
    data.keyword = b.keyword;
  }
  if (b.category_id != null) {
    if (typeof b.category_id !== "string" || b.category_id.length > 50) return { valid: false, error: "Invalid category_id" };
    data.category_id = b.category_id;
  }
  if (b.advertiser_id != null) {
    if (typeof b.advertiser_id !== "string" || b.advertiser_id.length > 50) return { valid: false, error: "Invalid advertiser_id" };
    data.advertiser_id = b.advertiser_id;
  }
  return { valid: true, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PASSIO_API_TOKEN = Deno.env.get("PASSIO_API_TOKEN");
    if (!PASSIO_API_TOKEN) {
      console.error("PASSIO_API_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.json();
    const validation = validateParams(rawBody);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({ token: PASSIO_API_TOKEN, ...validation.data });
    const res = await fetch(`${PRODUCTS_URL}?${params.toString()}`);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Upstream API error" }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.text();
    return new Response(data, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
