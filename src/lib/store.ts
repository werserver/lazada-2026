// Admin settings — stored in localStorage, with config.ts as defaults
import config from "@/lib/config";

const SETTINGS_KEY = "aff-shop-settings-v2";
const CSV_DATA_KEY = "aff-shop-csv-data-v2";

export interface AdminSettings {
  dataSource: "api" | "csv";
  apiToken: string;
  categories: string[];
  keywords: string[];
  prefixWords: string[];
  selectedAdvertisers: string[];
  enableFlashSale: boolean;
  enableAiReviews: boolean;
  enablePrefixWords: boolean;
  defaultCurrency: string;
  csvFileName: string;
  cloakingBaseUrl: string;
  cloakingToken: string;
  siteName: string;
  faviconUrl: string;
  /** Category CSV data: key = category name, value = CSV text */
  categoryCsvMap: Record<string, string>;
  /** Category CSV file names for display */
  categoryCsvFileNames: Record<string, string>;
}

const DEFAULT_PREFIXES = [
  "ถูกที่สุด", "ลดราคา", "ส่วนลดพิเศษ", "ขายดี", "แนะนำ", 
  "คุ้มสุดๆ", "ราคาดี", "โปรโมชั่น", "สุดคุ้ม", "ห้ามพลาด", 
  "ราคาถูก", "ดีลเด็ด", "ลดแรง", "ยอดนิยม", "ราคาพิเศษ"
];

function getDefaults(): AdminSettings {
  return {
    dataSource: "csv",
    apiToken: "",
    categories: ["สินค้าแนะนำ", "มือถือและอุปกรณ์", "เครื่องใช้ไฟฟ้า", "แฟชั่น"],
    keywords: [...config.keywords],
    prefixWords: [...DEFAULT_PREFIXES],
    selectedAdvertisers: [...config.selectedAdvertisers],
    enableFlashSale: config.enableFlashSale,
    enableAiReviews: config.enableAiReviews,
    enablePrefixWords: true,
    defaultCurrency: config.defaultCurrency,
    csvFileName: "",
    cloakingBaseUrl: "https://goeco.mobi/?token=QlpXZyCqMylKUjZiYchwB",
    cloakingToken: "QlpXZyCqMylKUjZiYchwB",
    siteName: "Lazada Deals 2026",
    faviconUrl: "https://www.lazada.co.th/favicon.ico",
    categoryCsvMap: {},
    categoryCsvFileNames: {},
  };
}

export function getAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Ensure we don't have sitemap in dataSource
      if (saved.dataSource === "sitemap") saved.dataSource = "csv";
      return { ...getDefaults(), ...saved };
    }
  } catch {}
  return getDefaults();
}

export function saveAdminSettings(settings: AdminSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// CSV data stored in localStorage
export function getCsvData(): string | null {
  try {
    return localStorage.getItem(CSV_DATA_KEY);
  } catch {
    return null;
  }
}

export function saveCsvData(csvText: string): void {
  localStorage.setItem(CSV_DATA_KEY, csvText);
}

export function clearCsvData(): void {
  localStorage.removeItem(CSV_DATA_KEY);
}
