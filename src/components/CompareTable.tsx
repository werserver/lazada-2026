import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, getProductRating, type Product } from "@/lib/api";
import { StarRating } from "./StarRating";
import { ExternalLink } from "lucide-react";

interface CompareTableProps {
  products: Product[];
}

export function CompareTable({ products }: CompareTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  const compareItems = products.filter((p) => selected.has(p.product_id));

  return (
    <div className="space-y-4">
      {/* Selection */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">
          เลือกสินค้าเปรียบเทียบ (สูงสุด 5 รายการ) — เลือกแล้ว {selected.size} รายการ
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
          {products.map((p) => (
            <label
              key={p.product_id}
              className="flex items-start gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/50 transition-colors text-xs"
            >
              <Checkbox
                checked={selected.has(p.product_id)}
                onCheckedChange={() => toggle(p.product_id)}
                disabled={!selected.has(p.product_id) && selected.size >= 5}
              />
              <span className="line-clamp-2">{p.product_name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {compareItems.length >= 2 && (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 font-semibold">รายละเอียด</TableHead>
                {compareItems.map((p) => (
                  <TableHead key={p.product_id} className="min-w-[180px]">
                    <div className="space-y-1">
                      <img
                        src={p.product_picture}
                        alt={p.product_name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <p className="text-xs font-medium line-clamp-2">{p.product_name}</p>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">ราคาเต็ม</TableCell>
                {compareItems.map((p) => (
                  <TableCell key={p.product_id}>
                    {formatPrice(p.product_price, p.product_currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">ราคาลด</TableCell>
                {compareItems.map((p) => {
                  const best =
                    compareItems.reduce((min, c) => {
                      const price = c.product_discounted || c.product_price;
                      return price < min ? price : min;
                    }, Infinity) === (p.product_discounted || p.product_price);
                  return (
                    <TableCell key={p.product_id}>
                      <span className={best ? "text-primary font-bold" : ""}>
                        {formatPrice(p.product_discounted || p.product_price, p.product_currency)}
                      </span>
                      {best && (
                        <Badge className="ml-1.5 bg-success text-primary-foreground border-0 text-[10px]">
                          ถูกสุด
                        </Badge>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">ส่วนลด</TableCell>
                {compareItems.map((p) => (
                  <TableCell key={p.product_id}>
                    {p.product_discounted_percentage > 0 ? (
                      <Badge className="bg-sale text-primary-foreground border-0">
                        -{p.product_discounted_percentage}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">คะแนน</TableCell>
                {compareItems.map((p) => {
                  const { rating, reviewCount } = getProductRating(p.product_id);
                  return (
                    <TableCell key={p.product_id}>
                      <StarRating rating={rating} count={reviewCount} />
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">หมวดหมู่</TableCell>
                {compareItems.map((p) => (
                  <TableCell key={p.product_id}>
                    <Badge variant="secondary">{p.category_name}</Badge>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">ร้านค้า</TableCell>
                {compareItems.map((p) => (
                  <TableCell key={p.product_id} className="text-sm">
                    {p.advertiser_id}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">ลิงก์</TableCell>
                {compareItems.map((p) => (
                  <TableCell key={p.product_id}>
                    <a
                      href={p.tracking_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="h-3 w-3" />
                      ซื้อเลย
                    </a>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {compareItems.length === 1 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          กรุณาเลือกอย่างน้อย 2 รายการเพื่อเปรียบเทียบ
        </p>
      )}
    </div>
  );
}
