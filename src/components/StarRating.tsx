import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
}

export function StarRating({ rating, count }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i <= Math.round(rating)
                ? "fill-star text-star"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating} {count !== undefined && `(${count})`}
      </span>
    </div>
  );
}
