// Simple sitemap generator for static routes
// For a real sitemap.xml, this would need to be generated server-side
// This generates a basic sitemap for SEO crawlers via robots.txt reference

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};

export function generateSitemapXml(productSlugs: string[] = [], categories: string[] = []): string {
  const BASE_URL = getBaseUrl();
  const staticRoutes = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/wishlist", priority: "0.5", changefreq: "weekly" },
  ];

  const categoryRoutes = categories.map((cat) => ({
    loc: `/category/${encodeURIComponent(cat)}`,
    priority: "0.7",
    changefreq: "daily" as const,
  }));

  const productRoutes = productSlugs.map((slug) => ({
    loc: `/product/${slug}`,
    priority: "0.8",
    changefreq: "weekly" as const,
  }));

  const allRoutes = [...staticRoutes, ...categoryRoutes, ...productRoutes];

  const urls = allRoutes
    .map(
      (r) => `  <url>
    <loc>${BASE_URL}${r.loc}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
