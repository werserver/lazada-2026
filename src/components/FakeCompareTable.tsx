import { formatPrice, getProductRating, type Product } from "@/lib/api";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface FakeCompareTableProps {
  product: Product;
}

const fakeShops = [
  { name: "ShopA Official", suffix: "🏆 ร้านแนะนำ" },
  { name: "BestPrice Store", suffix: "" },
  { name: "MegaDeal Shop", suffix: "🔥 ขายดี" },
  { name: "ValuePlus Mall", suffix: "" },
  { name: "SuperSave Outlet", suffix: "⚡ ส่งไว" },
];

export function FakeCompareTable({ product }: FakeCompareTableProps) {
  const basePrice = product.product_discounted || product.product_price;
  const { rating } = getProductRating(product.product_id);

  // Generate fake prices slightly varied around the real price
  const fakeItems = fakeShops.map((shop, idx) => {
    let hash = 0;
    for (let i = 0; i < product.product_id.length; i++) {
      hash = (hash * 31 + product.product_id.charCodeAt(i) + idx * 7919) % 1000000;
    }
    const variation = 0.95 + (hash % 20) / 100; // 0.95 - 1.14x
    const fakePrice = Math.round(basePrice * variation);
    const fakeRating = Math.max(3.5, Math.min(5, rating + (hash % 10 - 5) / 10));

    return {
      shop: shop.name,
      suffix: shop.suffix,
      price: idx === 0 ? basePrice : fakePrice, // First one = real price (cheapest feel)
      rating: idx === 0 ? rating : Math.round(fakeRating * 10) / 10,
      isCheapest: false,
    };
  });

  // Mark cheapest
  const minPrice = Math.min(...fakeItems.map((i) => i.price));
  fakeItems.forEach((item) => {
    if (item.price === minPrice) item.isCheapest = true;
  });

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold">เปรียบเทียบราคาจากหลายร้าน</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 font-medium">ร้านค้า</th>
              <th className="pb-3 font-medium text-center">คะแนน</th>
              <th className="pb-3 font-medium text-right">ราคา</th>
              <th className="pb-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {fakeItems.map((item, idx) => (
              <tr
                key={idx}
                className={`border-b last:border-0 transition-colors hover:bg-muted/50 ${
                  item.isCheapest ? "bg-primary/5" : ""
                }`}
              >
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-card-foreground">{item.shop}</span>
                    {item.suffix && (
                      <span className="text-xs">{item.suffix}</span>
                    )}
                    {item.isCheapest && (
                      <Badge className="bg-[hsl(var(--success))] text-primary-foreground border-0 text-[10px] px-1.5">
                        ถูกสุด
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 text-center">
                  <StarRating rating={item.rating} />
                </td>
                <td className="py-3 text-right">
                  <span className={`font-bold ${item.isCheapest ? "text-primary" : "text-card-foreground"}`}>
                    {formatPrice(item.price, product.product_currency)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <a href={product.tracking_link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant={item.isCheapest ? "default" : "outline"} className="gap-1.5 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" />
                      ซื้อเลย
                    </Button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
