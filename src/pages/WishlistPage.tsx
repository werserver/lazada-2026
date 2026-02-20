import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { ProductCard } from "@/components/ProductCard";
import { getWishlist } from "@/lib/wishlist";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/api";

export default function WishlistPage() {
  const [items, setItems] = useState<Product[]>(getWishlist);

  useEffect(() => {
    const handler = () => setItems(getWishlist());
    window.addEventListener("wishlist-change", handler);
    return () => window.removeEventListener("wishlist-change", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="รายการโปรด" description="สินค้าที่คุณบันทึกไว้" />
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-destructive fill-destructive" />
          <h1 className="text-2xl font-bold">รายการโปรด ({items.length})</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-muted-foreground">ยังไม่มีสินค้าในรายการโปรด</p>
            <p className="text-sm text-muted-foreground">กดไอคอน ❤️ ที่สินค้าเพื่อบันทึกไว้ดูภายหลัง</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
