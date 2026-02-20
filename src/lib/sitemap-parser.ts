import type { Product, ProductsResponse } from "@/lib/api";
import { getAdminSettings } from "@/lib/store";
import { buildCloakedUrl } from "./url-builder";

/**
 * Sitemap Parser (Lazada Optimized v5 - Multi-Proxy & File Upload Support)
 */

const SITEMAP_CACHE_KEY = "lazada-sitemap-cache-v5";
const SITEMAP_URL_KEY = "lazada-sitemap-url-v5";

const PROXY_LIST = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

export async function parseAndCacheXml(xmlText: string, sourceIdentifier: string): Promise<void> {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const locs = Array.from(xmlDoc.getElementsByTagName("loc"));

    if (locs.length > 0) {
      const settings = getAdminSettings();
      // ดึง 2000 รายการแรกเพื่อความรวดเร็วและครอบคลุม
      const products = locs.slice(0, 2000).map((locNode, index) => 
        createProductFromLoc(locNode.textContent || "", index, settings)
      );
      
      localStorage.setItem(SITEMAP_CACHE_KEY, JSON.stringify(products));
      localStorage.setItem(SITEMAP_URL_KEY, sourceIdentifier);
      console.log(`Sitemap cached: ${products.length} products from ${sourceIdentifier}`);
    } else {
      throw new Error("ไม่พบรายการสินค้าในไฟล์ XML");
    }
  } catch (e) {
    console.error("XML Parsing error:", e);
    throw new Error("รูปแบบไฟล์ XML ไม่ถูกต้อง");
  }
}

export async function refreshSitemapCache(url: string): Promise<void> {
  if (!url) return;
  
  let xmlText = "";
  let error: any = null;

  for (const getProxyUrl of PROXY_LIST) {
    try {
      const proxyUrl = getProxyUrl(url);
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;
      
      if (proxyUrl.includes("allorigins")) {
        const json = await response.json();
        xmlText = json.contents;
      } else {
        xmlText = await response.text();
      }

      if (xmlText && xmlText.includes("<urlset")) break;
    } catch (e) {
      error = e;
      continue;
    }
  }

  if (!xmlText) {
    throw error || new Error("ไม่สามารถดึงข้อมูลจาก URL ได้ (CORS/Network Error)");
  }

  await parseAndCacheXml(xmlText, url);
}

export async function fetchSitemapProducts(params: {
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const settings = getAdminSettings();
  const sitemapUrl = settings.sitemapUrl;

  let products: Product[] = [];
  const cachedData = localStorage.getItem(SITEMAP_CACHE_KEY);
  
  if (cachedData) {
    try {
      products = JSON.parse(cachedData);
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }

  // ถ้าไม่มี Cache และมี URL ให้ดึงใหม่ในพื้นหลัง
  if (products.length === 0 && sitemapUrl) {
    products = generateMockLazadaProducts(settings);
    refreshSitemapCache(sitemapUrl).catch(console.error);
  }

  let filtered = products;
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

export function getSitemapProductById(id: string, slug?: string): Product | null {
  const cachedData = localStorage.getItem(SITEMAP_CACHE_KEY);
  if (cachedData) {
    try {
      const products: Product[] = JSON.parse(cachedData);
      const found = products.find(p => p.product_id === id);
      if (found) return found;
    } catch {}
  }

  if (slug) {
    const settings = getAdminSettings();
    let name = slug.split('-i')[0] || "สินค้าจาก Lazada";
    name = decodeURIComponent(name.replace(/-/g, ' '));
    const originalUrl = `https://www.lazada.co.th/products/${slug}`;
    
    return {
      product_id: id,
      product_name: name,
      product_picture: `https://picsum.photos/seed/${id}/600/600`,
      product_other_pictures: "",
      product_price: 1590,
      product_discounted: 1290,
      product_discounted_percentage: 19,
      product_currency: "THB",
      product_link: originalUrl,
      tracking_link: buildCloakedUrl(settings.cloakingToken, originalUrl, settings.cloakingBaseUrl),
      category_id: "sitemap",
      category_name: "สินค้าจาก Lazada",
      advertiser_id: "Lazada",
      shop_id: "Lazada Store",
      variations: "",
    };
  }
  
  return null;
}

function createProductFromLoc(loc: string, index: number, settings: any): Product {
  const urlParts = loc.split('/');
  const lastPart = urlParts[urlParts.length - 1] || "";
  
  let name = lastPart.split('-i')[0] || "Product";
  name = decodeURIComponent(name.replace(/-/g, ' ').replace(/\.html$/, ''));
  
  const idMatch = lastPart.match(/-i(\d+)/);
  const id = idMatch ? idMatch[1] : `s-${index}`;
  
  return {
    product_id: id,
    product_name: name,
    product_picture: `https://picsum.photos/seed/${id}/400/400`,
    product_other_pictures: "",
    product_price: 1290 + (index % 10 * 100),
    product_discounted: 890 + (index % 10 * 50),
    product_discounted_percentage: 31,
    product_currency: "THB",
    product_link: loc,
    tracking_link: buildCloakedUrl(settings.cloakingToken, loc, settings.cloakingBaseUrl),
    category_id: "sitemap",
    category_name: "สินค้าแนะนำ",
    advertiser_id: "Lazada",
    shop_id: "Lazada Store",
    variations: "",
  };
}

function generateMockLazadaProducts(settings: any): Product[] {
  const mockNames = [
    "หูฟังบลูทูธไร้สาย TWS คุณภาพสูง",
    "สมาร์ทวอทช์ หน้าจอ AMOLED กันน้ำ",
    "พาวเวอร์แบงค์ 30000mAh ชาร์จเร็ว",
    "ลำโพงบลูทูธ เสียงเบสแน่น",
    "เคสโทรศัพท์กันกระแทก ดีไซน์หรู",
    "สายชาร์จ Fast Charge 3A",
    "ขาตั้งกล้องมือถือ ปรับระดับได้",
    "เม้าส์ไร้สาย Ergonomic",
    "คีย์บอร์ดแมคคานิคอล RGB",
    "แผ่นรองเม้าส์ขนาดใหญ่พิเศษ"
  ];

  return mockNames.map((name, index) => {
    const id = `mock-${index}`;
    const loc = `https://www.lazada.co.th/products/item-${index}-i${index}.html`;
    return {
      product_id: id,
      product_name: name,
      product_picture: `https://picsum.photos/seed/${id}/400/400`,
      product_other_pictures: "",
      product_price: 1500 + (index * 100),
      product_discounted: 990 + (index * 50),
      product_discounted_percentage: 35,
      product_currency: "THB",
      product_link: loc,
      tracking_link: buildCloakedUrl(settings.cloakingToken, loc, settings.cloakingBaseUrl),
      category_id: "sitemap",
      category_name: "สินค้าแนะนำ",
      advertiser_id: "Lazada",
      shop_id: "Lazada Official",
      variations: "",
    };
  });
}
