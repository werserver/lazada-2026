import { Megaphone } from "lucide-react";

export function PriceAlertBanner() {
  return (
    <div className="bg-gradient-to-r from-destructive to-[hsl(var(--sale))] text-primary-foreground py-2 px-4 text-center text-xs sm:text-sm animate-fade-in">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <Megaphone className="h-4 w-4 shrink-0 animate-pulse" />
        <span className="font-medium">
          🔥 ดีลพิเศษวันนี้! สินค้าลดราคาสูงสุด 50% — รีบสั่งซื้อก่อนหมดเขต!
        </span>
      </div>
    </div>
  );
}
