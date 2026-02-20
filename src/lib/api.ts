import { getAdminSettings } from "@/lib/store";
import { buildCloakedUrl } from "@/lib/url-builder";

export interface Product {
  product_id: string;
  product_name: string;
  product_picture: string;
  product_other_pictures: string;
  product_price: number;
  product_discounted: number;
  product_discounted_percentage: number;
  product_currency: string;
  product_link: string;
  tracking_link: string;
  category_id: string;
  category_name: string;
  advertiser_id: string;
  shop_id: string;
  variations?: string;
}

export interface ProductsResponse {
  meta: { total: number; limit: number; page: number };
  data: Product[];
}

export interface FetchProductsParams {
  keyword?: string;
  category_id?: string;
  advertiser_id?: string;
  limit?: number;
  page?: number;
}

// Simple in-memory product cache
const productCache = new Map<string, Product>();

export function getCachedProduct(id: string): Product | undefined {
  return productCache.get(id);
}

// Page-level response cache for faster repeat loads
const pageCache = new Map<string, { data: ProductsResponse; timestamp: number }>();
const PAGE_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getPageCacheKey(params: FetchProductsParams): string {
  return JSON.stringify({
    keyword: params.keyword,
    category_id: params.category_id,
    advertiser_id: params.advertiser_id,
    limit: params.limit ?? 20,
    page: params.page ?? 1,
  });
}

const PRODUCTS_URL = "https://ga.passio.eco/api/v3/products";

export async function fetchProducts(params: FetchProductsParams): Promise<ProductsResponse> {
  const cacheKey = getPageCacheKey(params);
  const cached = pageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PAGE_CACHE_TTL) {
    return cached.data;
  }

  const settings = getAdminSettings();
  const token = settings.apiToken;
  if (!token) throw new Error("API Token ยังไม่ได้ตั้งค่า กรุณาไปที่หน้า Admin เพื่อกรอก API Token");

  const queryParams = new URLSearchParams({
    token,
    limit: String(params.limit ?? 20),
    page: String(params.page ?? 1),
  });
  if (params.keyword) queryParams.set("keyword", params.keyword);
  if (params.category_id) queryParams.set("category_id", params.category_id);
  if (params.advertiser_id) queryParams.set("advertiser_id", params.advertiser_id);

  const res = await fetch(`${PRODUCTS_URL}?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch products");

  const result: ProductsResponse = await res.json();

  // Apply URL Cloaking to all products
  result.data = result.data.map(p => ({
    ...p,
    tracking_link: buildCloakedUrl(settings.cloakingToken, p.tracking_link, settings.cloakingBaseUrl)
  }));

  // Cache all fetched products
  result.data.forEach((p) => productCache.set(p.product_id, p));

  // Cache page response
  pageCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

// Conversions API
export interface ConversionItem {
  id: string;
  sku: string;
  payout: number;
  payout_bonus: number;
  sale_amount: number;
  status: string;
  time: string;
  currency: string;
  product_name: string;
  category_name: string;
}

export interface Conversion {
  _id: string;
  advertiser: string;
  adv_order_id: string;
  time: string;
  payout_approved: number;
  payout_pending: number;
  payout_rejected: number;
  sale_amount: number;
  item_count: number;
  status: string;
  buyer_country: string;
  item_list: ConversionItem[];
}

export interface ConversionsResponse {
  meta: { total: number; skip: number; limit: number };
  data: Conversion[];
}

const CONVERSIONS_URL = "https://api.ecotrackings.com/api/v3/conversions";

export async function fetchConversions(params: {
  start_date?: string;
  end_date?: string;
  status?: string;
  limit?: number;
  page?: number;
}): Promise<ConversionsResponse> {
  const settings = getAdminSettings();
  const token = settings.apiToken;
  if (!token) throw new Error("API Token ยังไม่ได้ตั้งค่า");

  const queryParams = new URLSearchParams({
    token_private: token,
    limit: String(params.limit ?? 50),
    page: String(params.page ?? 1),
  });
  if (params.start_date) queryParams.set("start_date", params.start_date);
  if (params.end_date) queryParams.set("end_date", params.end_date);
  if (params.status) queryParams.set("status", params.status);

  const res = await fetch(`${CONVERSIONS_URL}?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch conversions");
  return res.json();
}

// Generate fake but consistent rating/review for a product
export function getProductRating(productId: string) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) % 1000000;
  }
  const rating = 3.5 + (hash % 15) / 10;
  const reviewCount = 10 + (hash % 490);
  return { rating: Math.round(rating * 10) / 10, reviewCount };
}

// Generate fake reviews for product detail page
export function getProductReviews(productId: string) {
  const { rating } = getProductRating(productId);
  const reviewerNames = [
    "สมชาย ก.", "สมหญิง ข.", "วิชัย ค.", "ปิยะ ง.", "นภา จ.",
    "อรุณ ฉ.", "กมล ช.", "ดวงใจ ซ.", "มานี ส.", "ประเสริฐ พ.",
  ];
  const comments = [
    "สินค้าดีมาก คุ้มค่า ส่งเร็ว",
    "คุณภาพดี ตรงตามรูป แนะนำเลย",
    "พอใช้ได้ ราคาถูกดี",
    "ชอบมากค่ะ สั่งซ้ำแน่นอน",
    "ส่งไว แพ็คดี สินค้าสวย",
    "ราคาเทียบกับคุณภาพถือว่าโอเค",
    "ใช้ดีมาก คุ้มเงินที่จ่ายไป",
    "สินค้าเหมือนในรูป พอใจมาก",
    "ได้รับสินค้าเร็ว บรรจุภัณฑ์ดี",
    "แนะนำให้ซื้อเลย ไม่ผิดหวัง",
  ];

  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 37 + productId.charCodeAt(i)) % 1000000;
  }

  const count = 3 + (hash % 5);
  return Array.from({ length: count }).map((_, idx) => {
    const seed = (hash + idx * 7919) % 1000000;
    const reviewRating = Math.max(3, Math.min(5, Math.round(rating + (seed % 3 - 1))));
    return {
      id: `${productId}-review-${idx}`,
      name: reviewerNames[seed % reviewerNames.length],
      rating: reviewRating,
      comment: comments[seed % comments.length],
      date: `${2025 - (seed % 2)}-${String(1 + (seed % 12)).padStart(2, "0")}-${String(1 + (seed % 28)).padStart(2, "0")}`,
    };
  });
}

export function formatPrice(price: number, currency: string) {
  const currencyMap: Record<string, string> = {
    VND: "vi-VN",
    THB: "th-TH",
    IDR: "id-ID",
    PHP: "fil-PH",
    MYR: "ms-MY",
    SGD: "en-SG",
  };
  return new Intl.NumberFormat(currencyMap[currency] || "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
