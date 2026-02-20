import Papa from "papaparse";
import type { Product, ProductsResponse } from "@/lib/api";
import { getAdminSettings, getCsvData } from "@/lib/store";
import config from "@/lib/config";
import { buildCloakedUrl } from "./url-builder";

interface ShopeeRow {
  id: string;
  url: string;
  name: string;
  price: string;
  price_min: string;
  original_price: string;
  discount: string;
  shop_name: string;
  shop_location: string;
  rating: string;
  rating_count: string;
  sold_count: string;
  sold_count_text: string;
  image: string;
  images: string;
  category: string;
  shopid: string;
  variations: string;
}

let cachedProducts: Product[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

function mapRowToProduct(row: ShopeeRow, categoryOverride?: string): Product {
  const settings = getAdminSettings();
  const originalPrice = parseFloat(row.original_price) || parseFloat(row.price) || 0;
  const currentPrice = parseFloat(row.price_min) || parseFloat(row.price) || 0;
  const discountPct = parseInt(row.discount) || (originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0);

  const images = (row.images || "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"));

  const productUrl = row.url || "";
  
  // ✅ ใช้ URL Cloaking ทุกจุด
  const trackingLink = buildCloakedUrl(settings.cloakingToken, productUrl, settings.cloakingBaseUrl);

  return {
    product_id: String(row.id),
    product_name: row.name || "",
    product_picture: row.image || images[0] || "",
    product_other_pictures: images.join(","),
    product_price: originalPrice,
    product_discounted: currentPrice,
    product_discounted_percentage: discountPct,
    product_currency: settings.defaultCurrency || config.defaultCurrency,
    product_link: productUrl,
    tracking_link: trackingLink,
    category_id: "",
    category_name: categoryOverride || row.category || "",
    advertiser_id: row.shopid || "",
    shop_id: row.shop_name || "",
    variations: row.variations || "",
  };
}

async function loadCsvProducts(): Promise<Product[]> {
  if (cachedProducts && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedProducts;
  }

  const settings = getAdminSettings();
  const allProducts: Product[] = [];

  // Load category-specific CSVs
  for (const [catName, csvText] of Object.entries(settings.categoryCsvMap)) {
    if (csvText) {
      const products = await parseCsv(csvText, catName);
      allProducts.push(...products);
    }
  }

  // Load default CSV (from localStorage or file) if no category CSVs or as fallback
  if (allProducts.length === 0) {
    let csvText = getCsvData();
    if (!csvText) {
      const response = await fetch(config.csvFilePath);
      if (!response.ok) throw new Error("Failed to load CSV file");
      csvText = await response.text();
    }
    const products = await parseCsv(csvText);
    allProducts.push(...products);
  }

  cachedProducts = allProducts;
  cacheTimestamp = Date.now();
  return allProducts;
}

function parseCsv(csvText: string, categoryOverride?: string): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<ShopeeRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const products = results.data
          .filter((row) => row.id && row.name)
          .map((row) => mapRowToProduct(row, categoryOverride));
        resolve(products);
      },
      error: (err: Error) => reject(err),
    });
  });
}

export async function fetchCsvProducts(params: {
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const allProducts = await loadCsvProducts();
  const limit = params.limit ?? 20;
  const page = params.page ?? 1;

  let filtered = allProducts;

  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.product_name.toLowerCase().includes(kw) ||
        p.category_name.toLowerCase().includes(kw)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    meta: { total, limit, page },
    data,
  };
}

export function clearCsvCache() {
  cachedProducts = null;
  cacheTimestamp = 0;
}
