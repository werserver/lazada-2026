import { getProductRating, formatPrice, type Product } from "@/lib/api";
import { StarRating } from "./StarRating";
import { WishlistButton } from "./WishlistButton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { productPath } from "@/lib/slug";
import { getAdminSettings } from "@/lib/store";
import { getPrefixedName } from "@/lib/prefix-words";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { rating, reviewCount } = getProductRating(product.product_id);
  const hasDiscount = product.product_discounted_percentage > 0;
  const settings = getAdminSettings();
  const displayName = settings.enablePrefixWords
    ? getPrefixedName(product.product_id, product.product_name)
    : product.product_name;

  return (
    <div className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in">
      <Link to={productPath(product.product_id, product.product_name)} state={{ product }}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.product_picture}
            alt={displayName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {hasDiscount && (
            <Badge className="absolute left-2 top-2 bg-sale text-primary-foreground border-0 text-xs font-semibold">
              -{product.product_discounted_percentage}%
            </Badge>
          )}
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <WishlistButton product={product} />
          </div>
        </div>

        <div className="p-3 space-y-2">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground hover:text-primary transition-colors">
            {displayName}
          </h3>

          <StarRating rating={rating} count={reviewCount} />

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(hasDiscount ? product.product_discounted : product.product_price, product.product_currency)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.product_price, product.product_currency)}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground truncate">
            {product.category_name}
          </p>
        </div>
      </Link>
    </div>
  );
}
