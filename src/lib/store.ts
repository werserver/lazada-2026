// Admin settings — stored in localStorage, with config.ts as defaults
import config from "@/lib/config";

const SETTINGS_KEY = "aff-shop-settings";
const CSV_DATA_KEY = "aff-shop-csv-data";

export interface AdminSettings {
  dataSource: "api" | "csv" | "sitemap";
  apiToken: string;
  categories: string[];
  keywords: string[];
  selectedAdvertisers: string[];
  enableFlashSale: boolean;
  enableAiReviews: boolean;
  enablePrefixWords: boolean;
  defaultCurrency: string;
  csvFileName: string;
  cloakingBaseUrl: string;
  cloakingToken?: string;
  siteName: string;
  faviconUrl: string;
  sitemapUrl: string;
  /** Category CSV data: key = category name, value = CSV text */
  categoryCsvMap: Record<string, string>;
  /** Category CSV file names for display */
  categoryCsvFileNames: Record<string, string>;
}

function getDefaults(): AdminSettings {
  return {
    dataSource: config.dataSource,
    apiToken: "",
    categories: [...config.categories],
    keywords: [...config.keywords],
    selectedAdvertisers: [...config.selectedAdvertisers],
    enableFlashSale: config.enableFlashSale,
    enableAiReviews: config.enableAiReviews,
    enablePrefixWords: false,
    defaultCurrency: config.defaultCurrency,
    csvFileName: "",
    cloakingBaseUrl: "",
    cloakingToken: "",
    siteName: "Lazada 2026",
    faviconUrl: "/favicon.ico",
    sitemapUrl: "",
    categoryCsvMap: {},
    categoryCsvFileNames: {},
  };
}

export function getAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
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
