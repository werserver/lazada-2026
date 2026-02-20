import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function validateInput(body: unknown): { valid: true; data: { productName: string; categoryName: string; price: number; currency: string } } | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Invalid request body" };
  const { productName, categoryName, price, currency } = body as Record<string, unknown>;
  if (!productName || typeof productName !== "string" || productName.length > 200) return { valid: false, error: "Invalid product name" };
  if (!categoryName || typeof categoryName !== "string" || categoryName.length > 100) return { valid: false, error: "Invalid category name" };
  if (typeof price !== "number" || price < 0 || price > 1e9) return { valid: false, error: "Invalid price" };
  if (!currency || typeof currency !== "string" || currency.length > 10) return { valid: false, error: "Invalid currency" };
  return { valid: true, data: { productName: productName.slice(0, 200), categoryName: categoryName.slice(0, 100), price, currency: currency.slice(0, 10) } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { error: claimsError } = await supabase.auth.getClaims(token);
    // Allow anon key calls (no user) since this is a public feature, but ensure valid token
    if (claimsError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Input validation
    const rawBody = await req.json();
    const validation = validateInput(rawBody);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { productName, categoryName, price, currency } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `คุณเป็นผู้เชี่ยวชาญเขียนคำอธิบายสินค้าเป็นภาษาไทย เขียนให้น่าสนใจ กระชับ น่าซื้อ
ตอบเป็น JSON เท่านั้น ห้ามมี markdown หรือ code block
Format: {"description":"คำอธิบายสินค้า 2-3 ย่อหน้า","highlights":["จุดเด่น 1","จุดเด่น 2","จุดเด่น 3","จุดเด่น 4"]}`,
            },
            {
              role: "user",
              content: `เขียนคำอธิบายสินค้า: "${productName}" หมวดหมู่: ${categoryName} ราคา: ${price} ${currency}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    let result = { description: "", highlights: [] };
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse:", content);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
