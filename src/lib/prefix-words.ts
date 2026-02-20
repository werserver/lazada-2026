// Persuasive prefix words to add before product names
const PREFIXES = [
  "ถูกที่สุด",
  "ลดราคา",
  "ส่วนลดพิเศษ",
  "ขายดี",
  "แนะนำ",
  "คุ้มสุดๆ",
  "ราคาดี",
  "โปรโมชั่น",
  "สุดคุ้ม",
  "ห้ามพลาด",
  "ราคาถูก",
  "ดีลเด็ด",
  "ลดแรง",
  "ยอดนิยม",
  "ราคาพิเศษ",
];

// Deterministic random based on product ID
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000000;
  }
  return hash;
}

export function getPrefix(productId: string): string {
  const idx = hashCode(productId) % PREFIXES.length;
  return PREFIXES[idx];
}

export function getPrefixedName(productId: string, name: string): string {
  return `${getPrefix(productId)} ${name}`;
}
