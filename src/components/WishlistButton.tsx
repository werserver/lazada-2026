import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleWishlist, isInWishlist } from "@/lib/wishlist";
import type { Product } from "@/lib/api";
import { toast } from "sonner";

interface WishlistButtonProps {
  product: Product;
  className?: string;
}

export function WishlistButton({ product, className = "" }: WishlistButtonProps) {
  const [liked, setLiked] = useState(() => isInWishlist(product.product_id));

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    setLiked(added);
    toast.success(added ? "เพิ่มในรายการโปรดแล้ว ❤️" : "ลบออกจากรายการโปรดแล้ว");
    // Dispatch event so other components can react
    window.dispatchEvent(new Event("wishlist-change"));
  };

  return (
    <button
      onClick={handleToggle}
      className={`rounded-full p-1.5 transition-all ${
        liked
          ? "bg-destructive/10 text-destructive"
          : "bg-card/80 text-muted-foreground hover:text-destructive"
      } ${className}`}
      aria-label={liked ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
    </button>
  );
}
