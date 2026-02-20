import type { Product } from "@/lib/api";

const WISHLIST_KEY = "aff-shop-wishlist";
const RECENTLY_KEY = "aff-shop-recently";
const MAX_RECENTLY = 10;

export function getWishlist(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleWishlist(product: Product): boolean {
  const list = getWishlist();
  const idx = list.findIndex((p) => p.product_id === product.product_id);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    return false; // removed
  }
  list.unshift(product);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  return true; // added
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().some((p) => p.product_id === productId);
}

export function getRecentlyViewed(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product: Product) {
  const list = getRecentlyViewed().filter((p) => p.product_id !== product.product_id);
  list.unshift(product);
  localStorage.setItem(RECENTLY_KEY, JSON.stringify(list.slice(0, MAX_RECENTLY)));
}
