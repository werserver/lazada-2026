import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONVERSIONS_URL = "https://api.ecotrackings.com/api/v3/conversions";

function validateParams(body: unknown): { valid: true; data: Record<string, string> } | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Invalid request body" };
  const b = body as Record<string, unknown>;
  const data: Record<string, string> = {};

  const limit = Number(b.limit ?? 50);
  const page = Number(b.page ?? 1);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) return { valid: false, error: "Invalid limit" };
  if (!Number.isInteger(page) || page < 1 || page > 1000) return { valid: false, error: "Invalid page" };
  data.limit = String(limit);
  data.page = String(page);

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (b.start_date != null) {
    if (typeof b.start_date !== "string" || !dateRegex.test(b.start_date)) return { valid: false, error: "Invalid start_date" };
    data.start_date = b.start_date;
  }
  if (b.end_date != null) {
    if (typeof b.end_date !== "string" || !dateRegex.test(b.end_date)) return { valid: false, error: "Invalid end_date" };
    data.end_date = b.end_date;
  }
  if (b.status != null) {
    if (typeof b.status !== "string" || !["pending", "approved", "rejected"].includes(b.status)) return { valid: false, error: "Invalid status" };
    data.status = b.status;
  }
  return { valid: true, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - conversions data is sensitive
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ECOTRACKINGS_API_TOKEN = Deno.env.get("ECOTRACKINGS_API_TOKEN");
    if (!ECOTRACKINGS_API_TOKEN) {
      console.error("ECOTRACKINGS_API_TOKEN not configured");
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

    const params = new URLSearchParams({ token_private: ECOTRACKINGS_API_TOKEN, ...validation.data });
    const res = await fetch(`${CONVERSIONS_URL}?${params.toString()}`);

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
