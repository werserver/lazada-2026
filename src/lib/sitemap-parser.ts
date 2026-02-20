import type { Product, ProductsResponse } from "@/lib/api";
import { getAdminSettings } from "@/lib/store";
import { buildCloakedUrl } from "./url-builder";

/**
 * Sitemap Parser
 * ดึงข้อมูลสินค้าจาก Sitemap XML
 */

let cachedSitemapProducts: Product[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

export async function fetchSitemapProducts(params: {
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const settings = getAdminSettings();
  const sitemapUrl = settings.sitemapUrl;

  if (!sitemapUrl) {
    throw new Error("กรุณาระบุ Sitemap URL ในหน้า Admin");
  }

  if (!cachedSitemapProducts || Date.now() - cacheTimestamp > CACHE_TTL) {
    try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลจาก Sitemap ได้");
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const urls = Array.from(xmlDoc.getElementsByTagName("url"));

      cachedSitemapProducts = urls.map((urlNode, index) => {
        const loc = urlNode.getElementsByTagName("loc")[0]?.textContent || "";
        // พยายามดึงชื่อสินค้าจาก URL หรือใช้ชื่อจำลอง
        const urlParts = loc.split('/');
        const lastPart = urlParts[urlParts.length - 1] || "Product";
        const name = decodeURIComponent(lastPart.replace(/-/g, ' ').replace(/\.html$/, ''));
        
        const id = `sitemap-${index}`;
        
        return {
          product_id: id,
          product_name: name,
          product_picture: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800", // Placeholder
          product_other_pictures: "",
          product_price: 990, // Placeholder
          product_discounted: 790, // Placeholder
          product_discounted_percentage: 20,
          product_currency: "THB",
          product_link: loc,
          tracking_link: buildCloakedUrl(settings.cloakingToken, loc, settings.cloakingBaseUrl),
          category_id: "sitemap",
          category_name: "Sitemap Products",
          advertiser_id: "Sitemap",
          shop_id: "Sitemap Store",
          variations: "",
        };
      });
      cacheTimestamp = Date.now();
    } catch (error) {
      console.error("Sitemap parse error:", error);
      throw new Error("เกิดข้อผิดพลาดในการอ่าน Sitemap");
    }
  }

  let filtered = cachedSitemapProducts || [];
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(p => p.product_name.toLowerCase().includes(kw));
  }

  const limit = params.limit ?? 20;
  const page = params.page ?? 1;
  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    meta: { total, limit, page },
    data,
  };
}
