import type { Product, ProductsResponse } from "@/lib/api";
import { getAdminSettings } from "@/lib/store";
import { buildCloakedUrl } from "./url-builder";

/**
 * Sitemap Parser (Lazada Optimized with Local Cache)
 */

const SITEMAP_CACHE_KEY = "lazada-sitemap-cache";
const SITEMAP_URL_KEY = "lazada-sitemap-url";

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
  
  // 1. ลองดึงจาก Cache ใน LocalStorage ก่อน
  const cachedData = localStorage.getItem(SITEMAP_CACHE_KEY);
  const cachedUrl = localStorage.getItem(SITEMAP_URL_KEY);
  
  if (cachedData && cachedUrl === sitemapUrl) {
    try {
      products = JSON.parse(cachedData);
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }

  // 2. ถ้าไม่มี Cache หรือ URL เปลี่ยน ให้ดึงใหม่
  if (products.length === 0) {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(sitemapUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const json = await response.json();
      const xmlText = json.contents;
      
      if (!xmlText) throw new Error("No content from proxy");

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const locs = Array.from(xmlDoc.getElementsByTagName("loc"));

      if (locs.length > 0) {
        products = locs.map((locNode, index) => createProductFromLoc(locNode.textContent || "", index, settings));
        
        // บันทึกลง Cache (จำกัดจำนวนเพื่อไม่ให้เกินโควต้า LocalStorage)
        localStorage.setItem(SITEMAP_CACHE_KEY, JSON.stringify(products.slice(0, 1000)));
        localStorage.setItem(SITEMAP_URL_KEY, sitemapUrl);
      }
    } catch (error) {
      console.error("Sitemap fetch error:", error);
      // ถ้าดึงไม่ได้เลย ให้ใช้ Mock
      if (products.length === 0) {
        products = generateMockLazadaProducts(settings);
      }
    }
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

/**
 * ดึงข้อมูลสินค้าตัวเดียวจาก Cache (สำหรับหน้า Product Detail)
 */
export function getSitemapProductById(id: string): Product | null {
  const cachedData = localStorage.getItem(SITEMAP_CACHE_KEY);
  if (!cachedData) return null;
  
  try {
    const products: Product[] = JSON.parse(cachedData);
    return products.find(p => p.product_id === id) || null;
  } catch {
    return null;
  }
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
    product_price: 1290,
    product_discounted: 890,
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
