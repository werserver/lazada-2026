import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface AiDescriptionProps {
  productName: string;
  categoryName: string;
  price: number;
  currency: string;
}

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-description`;

export function AiDescription({ productName, categoryName, price, currency }: AiDescriptionProps) {
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(EDGE_FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ productName, categoryName, price, currency }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data?.description) {
        setDescription(data.description);
        setHighlights(data.highlights || []);
      }
    } catch (err) {
      console.error("Failed to generate description:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount
  useState(() => { generate(); });

  if (!description) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 animate-fade-in">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังสร้างคำอธิบายสินค้า...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-line">{description}</p>
      {highlights.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">จุดเด่นของสินค้า</p>
          <ul className="space-y-1.5">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
