import { useState, useEffect } from "react";
import { ShoppingCart, X } from "lucide-react";
import { formatPrice, type Product } from "@/lib/api";

const fakeNames = [
  "คุณสมชาย", "คุณนภา", "คุณวิชัย", "คุณปิยะ", "คุณอรุณ",
  "คุณดวงใจ", "คุณมานี", "คุณประเสริฐ", "คุณสมหญิง", "คุณกมล",
  "คุณพิมพ์", "คุณธนา", "คุณรัตนา", "คุณชัยวัฒน์", "คุณสุภาพร",
];

const fakeLocations = [
  "กรุงเทพฯ", "เชียงใหม่", "ขอนแก่น", "ภูเก็ต", "ชลบุรี",
  "นครราชสีมา", "เชียงราย", "สงขลา", "อุดรธานี", "นนทบุรี",
];

interface FakePurchasePopupProps {
  products: Product[];
}

export function FakePurchasePopup({ products }: FakePurchasePopupProps) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<{
    name: string;
    location: string;
    product: Product;
    time: string;
  } | null>(null);

  useEffect(() => {
    if (!products.length) return;

    const show = () => {
      const product = products[Math.floor(Math.random() * products.length)];
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const location = fakeLocations[Math.floor(Math.random() * fakeLocations.length)];
      const mins = Math.floor(Math.random() * 10) + 1;

      setCurrent({ name, location, product, time: `${mins} นาทีที่แล้ว` });
      setVisible(true);

      setTimeout(() => setVisible(false), 5000);
    };

    const interval = setInterval(show, 12000);
    const initial = setTimeout(show, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [products]);

  if (!visible || !current) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs animate-slide-in-right">
      <div className="rounded-xl border bg-card shadow-lg p-3 flex gap-3 items-start">
        <div className="shrink-0 h-12 w-12 rounded-lg overflow-hidden bg-muted">
          <a href={current.product.tracking_link} target="_blank" rel="noopener noreferrer">
            <img
              src={current.product.product_picture}
              alt=""
              className="h-full w-full object-cover"
            />
          </a>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-card-foreground">
            <span className="font-semibold">{current.name}</span> จาก{current.location}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            เพิ่งซื้อ{" "}
            <a
              href={current.product.tracking_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              {current.product.product_name.slice(0, 30)}...
            </a>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <ShoppingCart className="h-3 w-3 text-[hsl(var(--success))]" />
            <span className="text-[10px] text-muted-foreground">{current.time}</span>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-full p-0.5 hover:bg-muted text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
