import { useState, useEffect } from "react";
import { Flame, Clock } from "lucide-react";

interface FlashSaleCountdownProps {
  productId: string;
}

function getEndTime(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) % 1000000;
  }
  const hoursLeft = 1 + (hash % 23);
  const minutesLeft = hash % 60;
  const now = new Date();
  now.setHours(now.getHours() + hoursLeft);
  now.setMinutes(now.getMinutes() + minutesLeft);
  return now.getTime();
}

const endTimeCache = new Map<string, number>();

export function FlashSaleCountdown({ productId }: FlashSaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!endTimeCache.has(productId)) {
      endTimeCache.set(productId, getEndTime(productId));
    }
    const endTime = endTimeCache.get(productId)!;

    const update = () => {
      const diff = Math.max(0, endTime - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [productId]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="rounded-xl bg-gradient-to-r from-destructive to-[hsl(var(--sale))] p-3 text-primary-foreground animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="h-5 w-5 animate-pulse" />
        <span className="font-bold text-sm">⚡ Flash Sale — เวลาจำกัด!</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        <div className="flex gap-1">
          {[
            { val: pad(timeLeft.h), label: "ชม." },
            { val: pad(timeLeft.m), label: "นาที" },
            { val: pad(timeLeft.s), label: "วินาที" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span className="bg-primary-foreground/20 rounded-md px-2 py-1 font-mono text-lg font-bold tabular-nums">
                {item.val}
              </span>
              <span className="text-xs opacity-80">{item.label}</span>
              {idx < 2 && <span className="font-bold mx-0.5">:</span>}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs mt-2 opacity-80">🔥 สินค้ากำลังจะหมด รีบสั่งซื้อเลย!</p>
    </div>
  );
}
