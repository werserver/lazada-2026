import { getAdminSettings } from "./store";

// Deterministic random based on product ID
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000000;
  }
  return hash;
}

export function getPrefix(productId: string): string {
  const settings = getAdminSettings();
  if (!settings.enablePrefixWords || !settings.prefixWords.length) return "";
  
  const idx = hashCode(productId) % settings.prefixWords.length;
  return settings.prefixWords[idx];
}

export function getPrefixedName(productId: string, name: string): string {
  const prefix = getPrefix(productId);
  return prefix ? `${prefix} ${name}` : name;
}
