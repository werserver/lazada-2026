import type { Product, ProductsResponse } from "@/lib/api";
import { getAdminSettings } from "@/lib/store";
import { buildCloakedUrl } from "./url-builder";

/**
 * Sitemap Parser (Lazada Optimized v3 - Server-Side Simulation & Persistent Cache)
 */

const SITEMAP_CACHE_KEY = "lazada-sitemap-cache-v3";
const SITEMAP_URL_KEY = "lazada-sitemap-url-v3";

// ฟังก์ชันสำหรับดึงข้อมูลและเก็บลง Cache (เรียกใช้เมื่อกดบันทึกใน Admin หรือเมื่อไม่มีข้อมูล)
export async function refreshSitemapCache(url: string): Promise<void> {
  if (!url) return;
  
  try {
    // ใช้ Proxy ดึงข้อมูล (ในระบบจริงส่วนนี้ควรทำที่ Server-side)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const json = await response.json();
    const xmlText = json.contents;
    
    if (!xmlText) throw new Error("No content from proxy");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const locs = Array.from(xmlDoc.getElementsByTagName("loc"));

    if (locs.length > 0) {
      const settings = getAdminSettings();
      // ดึง 1000 รายการเพื่อความครอบคลุม
      const products = locs.slice(0, 1000).map((locNode, index) => 
        createProductFromLoc(locNode.textContent || "", index, settings)
      );
      
      // บันทึกลง Cache (ใช้ระบบที่เสถียรกว่า LocalStorage ถ้าเป็นไปได้ แต่ในที่นี้ใช้ LocalStorage เป็นตัวแทน)
      localStorage.setItem(SITEMAP_CACHE_KEY, JSON.stringify(products));
      localStorage.setItem(SITEMAP_URL_KEY, url);
      console.log(`Sitemap cached: ${products.length} products`);
    }
  } catch (error) {
    console.error("Failed to refresh sitemap cache:", error);
    throw error;
  }
}

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

  let products: Product[] = [];
  
  // 1. ดึงจาก Cache ทันที (Instant Load)
  const cachedData = localStorage.getItem(SITEMAP_CACHE_KEY);
  const cachedUrl = localStorage.getItem(SITEMAP_URL_KEY);
  
  if (cachedData && cachedUrl === sitemapUrl) {
    try {
      products = JSON.parse(cachedData);
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }

  // 2. ถ้าไม่มี Cache ให้ดึงใหม่ในพื้นหลัง (Background Fetch)
  if (products.length === 0) {
    // แสดง Mock ไปก่อนเพื่อให้หน้าเว็บไม่ว่าง
    products = generateMockLazadaProducts(settings);
    // ดึงข้อมูลจริงมาเก็บไว้ใช้ครั้งหน้า
    refreshSitemapCache(sitemapUrl).catch(console.error);
  }

  // 3. กรองข้อมูลตาม Keyword
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

  // ถ้าไม่เจอใน Cache ให้สร้างข้อมูลจาก Slug ทันที (Deep Link)
  if (slug) {
    const settings = getAdminSettings();
    let name = slug.split('-').slice(1).join(' ').replace(/\.html$/, '');
    if (!name || name === "product") name = "สินค้าจาก Lazada";
    
    const originalUrl = `https://www.lazada.co.th/products/${slug}`;
    
    return {
      product_id: id,
      product_name: decodeURIComponent(name),
      product_picture: `https://picsum.photos/seed/${id}/600/600`,
      product_other_pictures: "",
      product_price: 1590, // Default price for deep links
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
