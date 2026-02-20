import { getAdminSettings } from "@/lib/store";
import { getPrefixedName } from "@/lib/prefix-words";

// Convert product name to URL-safe slug
export function toSlug(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\-]/g, "")
    .toLowerCase();
}

// Build product path (with optional prefix)
// ✅ ใช้รูปแบบ /product/id-slug.html เพื่อให้ดึง ID ได้ง่ายและแม่นยำที่สุด
export function productPath(productId: string, productName: string): string {
  const settings = getAdminSettings();
  const displayName = settings.enablePrefixWords
    ? getPrefixedName(productId, productName)
    : productName;
  
  // เอา ID ไว้หน้าสุดเพื่อให้ดึงออกง่ายและไม่สับสนกับชื่อสินค้าที่มีขีดกลาง
  return `/product/${productId}-${toSlug(displayName)}.html`;
}

// Extract product ID from slug
export function extractIdFromSlug(slug: string): string {
  // ลบ .html ออก
  const withoutHtml = slug.replace(/\.html$/, "");
  // แยกด้วยขีดกลางตัวแรก (เพราะเราเอา ID ไว้หน้าสุด)
  const firstDashIndex = withoutHtml.indexOf("-");
  
  if (firstDashIndex === -1) return withoutHtml;
  
  return withoutHtml.substring(0, firstDashIndex);
}
