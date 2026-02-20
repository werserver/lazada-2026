import { useState } from "react";
import { Star, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiReview {
  name: string;
  rating: number;
  comment: string;
  pros: string;
  cons: string;
}

interface AiReviewsProps {
  productName: string;
  categoryName: string;
  price: number;
  currency: string;
}

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-reviews`;

export function AiReviews({ productName, categoryName, price, currency }: AiReviewsProps) {
  const [reviews, setReviews] = useState<AiReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateReviews = async () => {
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
      if (data?.reviews) {
        setReviews(data.reviews);
        setGenerated(true);
      }
    } catch (err) {
      console.error("Failed to generate reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!generated) {
    return (
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center space-y-3 animate-fade-in">
        <Sparkles className="h-8 w-8 text-primary mx-auto" />
        <p className="font-medium text-foreground">รีวิวจาก AI</p>
        <p className="text-sm text-muted-foreground">
          ใช้ AI วิเคราะห์และสร้างรีวิวสินค้าอัตโนมัติ
        </p>
        <Button onClick={generateReviews} disabled={loading} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังสร้างรีวิว...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              สร้างรีวิวด้วย AI
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">รีวิวจาก AI ({reviews.length})</h3>
      </div>
      {reviews.map((review, idx) => (
        <div
          key={idx}
          className="rounded-xl border bg-card p-4 space-y-2 animate-fade-in"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{review.name}</span>
            <span className="text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">AI Generated</span>
          </div>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i <= review.rating ? "fill-star text-star" : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-card-foreground">{review.comment}</p>
          {review.pros && (
            <p className="text-xs text-green-600">✅ {review.pros}</p>
          )}
          {review.cons && (
            <p className="text-xs text-muted-foreground">⚠️ {review.cons}</p>
          )}
        </div>
      ))}
    </div>
  );
}
