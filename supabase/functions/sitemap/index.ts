const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://thaideals.lovable.app";
const PRODUCTS_URL = "https://ga.passio.eco/api/v3/products";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PASSIO_API_TOKEN = Deno.env.get("PASSIO_API_TOKEN");
    if (!PASSIO_API_TOKEN) {
      return new Response("Server config error", { status: 500 });
    }

    // Fetch first page to get total count
    const params = new URLSearchParams({
      token: PASSIO_API_TOKEN,
      limit: "100",
      page: "1",
    });
    const res = await fetch(`${PRODUCTS_URL}?${params.toString()}`);
    if (!res.ok) {
      return new Response("Upstream error", { status: 502 });
    }
    const firstPage = await res.json();
    const total = firstPage.meta?.total ?? 0;
    const totalPages = Math.min(Math.ceil(total / 100), 10); // Limit to 10 pages for sitemap

    // Collect products from first page
    const allProducts = [...(firstPage.data || [])];

    // Fetch remaining pages in parallel (up to 10)
    if (totalPages > 1) {
      const promises = [];
      for (let p = 2; p <= totalPages; p++) {
        const pp = new URLSearchParams({
          token: PASSIO_API_TOKEN,
          limit: "100",
          page: String(p),
        });
        promises.push(
          fetch(`${PRODUCTS_URL}?${pp.toString()}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.data || [])
            .catch(() => [])
        );
      }
      const results = await Promise.all(promises);
      results.forEach((items) => allProducts.push(...items));
    }

    // Build slug helper (same logic as client)
    function toSlug(name: string, id: string): string {
      const slug = name
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
      return `${slug}-${id}.html`;
    }

    const now = new Date().toISOString().split("T")[0];

    // Static routes
    const staticUrls = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/wishlist", priority: "0.5", changefreq: "weekly" },
    ];

    // Category routes from unique categories
    const categories = [...new Set(allProducts.map((p: any) => p.category_name).filter(Boolean))];
    const categoryUrls = categories.map((cat: string) => ({
      loc: `/category/${encodeURIComponent(cat)}`,
      priority: "0.7",
      changefreq: "daily",
    }));

    // Product routes
    const productUrls = allProducts.map((p: any) => ({
      loc: `/product/${toSlug(p.product_name, p.product_id)}`,
      priority: "0.8",
      changefreq: "weekly",
    }));

    const allRoutes = [...staticUrls, ...categoryUrls, ...productUrls];

    const urls = allRoutes
      .map(
        (r) => `  <url>
    <loc>${BASE_URL}${r.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Sitemap error:", e);
    return new Response("Internal error", { status: 500 });
  }
});
