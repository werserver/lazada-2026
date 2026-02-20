import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type Product } from "@/lib/api";
import { fetchCsvProducts } from "@/lib/csv-products";
import { getAdminSettings } from "@/lib/store";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedProductsProps {
  product: Product;
}

export function RelatedProducts({ product }: RelatedProductsProps) {
  const settings = getAdminSettings();
  
  // ✅ แก้ไข: ดึงสินค้าทั้งหมดแล้วสุ่มมาแสดงตาม Issue #1
  const { data, isLoading } = useQuery({
    queryKey: ["all-products-for-related", settings.dataSource],
    queryFn: () =>
      settings.dataSource === "csv"
        ? fetchCsvProducts({ limit: 100, page: 1 })
        : fetchProducts({ limit: 100, page: 1 }),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // ✅ ดึงสินค้าอื่นๆ มาแสดง (ไม่ใช่สินค้าเดิม) และสุ่ม 5 ชิ้น
  const related = data?.data
    .filter((p) => p.product_id !== product.product_id)
    .sort(() => Math.random() - 0.5) // สุ่มสินค้า
    .slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-lg font-bold">สินค้าที่คุณอาจสนใจ</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border bg-card p-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!related.length) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold">สินค้าที่คุณอาจสนใจ</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {related.map((p) => (
          <ProductCard key={p.product_id} product={p} />
        ))}
      </div>
    </div>
  );
}
