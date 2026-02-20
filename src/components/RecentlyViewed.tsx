import { getRecentlyViewed } from "@/lib/wishlist";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/api";

export function RecentlyViewed() {
  const items: Product[] = getRecentlyViewed();

  if (!items.length) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-sm font-semibold text-muted-foreground">🕐 สินค้าที่เคยดู</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((p) => (
          <div key={p.product_id} className="w-40 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
