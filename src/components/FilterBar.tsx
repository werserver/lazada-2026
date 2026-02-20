import { useState } from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "default" | "price-asc" | "price-desc" | "discount";

interface FilterBarProps {
  onPriceRange: (min: number | undefined, max: number | undefined) => void;
  onSort: (sort: SortOption) => void;
  sort: SortOption;
}

export function FilterBar({ onPriceRange, onSort, sort }: FilterBarProps) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const applyFilter = () => {
    onPriceRange(
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined
    );
  };

  const clearFilter = () => {
    setMinPrice("");
    setMaxPrice("");
    onPriceRange(undefined, undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        <span>กรอง:</span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="ราคาต่ำสุด"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-28 h-9 text-sm"
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="number"
          placeholder="ราคาสูงสุด"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-28 h-9 text-sm"
        />
        <Button size="sm" variant="secondary" onClick={applyFilter}>
          ใช้
        </Button>
        {(minPrice || maxPrice) && (
          <Button size="sm" variant="ghost" onClick={clearFilter}>
            ล้าง
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select value={sort} onValueChange={(v) => onSort(v as SortOption)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">เรียงตามปกติ</SelectItem>
            <SelectItem value="price-asc">ราคาต่ำ → สูง</SelectItem>
            <SelectItem value="price-desc">ราคาสูง → ต่ำ</SelectItem>
            <SelectItem value="discount">ลดราคามากสุด</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
