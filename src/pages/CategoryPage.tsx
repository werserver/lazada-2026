import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterBar, type SortOption } from "@/components/FilterBar";
import { PaginationBar } from "@/components/PaginationBar";
import { SearchBar } from "@/components/SearchBar";
import { useProducts } from "@/hooks/useProducts";
import { getAdminSettings } from "@/lib/store";
import { ArrowLeft, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CategoryPage() {
  const { name } = useParams<{ name: string }>();
  const categoryName = decodeURIComponent(name || "");
  const settings = getAdminSettings();

  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("default");
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();

  const { data, isLoading } = useProducts(keyword || categoryName, undefined, page);

  const handleSearch = (kw: string) => {
    setKeyword(kw);
    setPage(1);
  };

  const filteredProducts = useMemo(() => {
    if (!data?.data) return [];
    let items = [...data.data];

    if (priceMin !== undefined) {
      items = items.filter((p) => (p.product_discounted || p.product_price) >= priceMin);
    }
    if (priceMax !== undefined) {
      items = items.filter((p) => (p.product_discounted || p.product_price) <= priceMax);
    }

    if (sort === "price-asc") {
      items.sort((a, b) => (a.product_discounted || a.product_price) - (b.product_discounted || b.product_price));
    } else if (sort === "price-desc") {
      items.sort((a, b) => (b.product_discounted || b.product_price) - (a.product_discounted || a.product_price));
    } else if (sort === "discount") {
      items.sort((a, b) => b.product_discounted_percentage - a.product_discounted_percentage);
    }

    return items;
  }, [data?.data, priceMin, priceMax, sort]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${categoryName} — ${settings.siteName}`}
        description={`รวมสินค้า ${categoryName} ลดราคา โปรโมชั่นสุดคุ้ม`}
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าแรก
        </Link>

        <div className="rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-8 animate-fade-in relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{categoryName}</h1>
          </div>
          <div className="relative">
            <SearchBar onSearch={handleSearch} initialValue={keyword} />
          </div>
        </div>

        {/* Other categories */}
        <div className="flex flex-wrap gap-2">
          {settings.categories
            .filter((c) => c !== categoryName)
            .map((cat) => (
              <Link key={cat} to={`/category/${encodeURIComponent(cat)}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-all px-3 py-1 rounded-full">
                  {cat}
                </Badge>
              </Link>
            ))}
        </div>

        <FilterBar
          onPriceRange={(min, max) => { setPriceMin(min); setPriceMax(max); }}
          onSort={setSort}
          sort={sort}
        />

        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-bold text-primary">
            {keyword ? `ผลการค้นหา "${keyword}" ใน ${categoryName}` : `สินค้าทั้งหมดใน ${categoryName}`}
          </h2>
          {data && (
            <span className="text-sm text-muted-foreground font-medium">
              {filteredProducts.length} รายการ
            </span>
          )}
        </div>

        <ProductGrid products={filteredProducts} isLoading={isLoading} />

        {data && (
          <PaginationBar
            currentPage={page}
            totalItems={data.meta.total}
            itemsPerPage={20}
            onPageChange={setPage}
          />
        )}
      </main>

      <footer className="bg-primary text-primary-foreground mt-12 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4">{settings.siteName}</h3>
              <p className="text-sm text-primary-foreground/70">
                แหล่งรวมดีลสินค้าออนไลน์ที่ดีที่สุด รวบรวมโปรโมชั่นจากร้านค้าชั้นนำมาไว้ในที่เดียว เพื่อให้คุณไม่พลาดทุกส่วนลด
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">หมวดหมู่แนะนำ</h3>
              <div className="flex flex-wrap gap-2">
                {settings.categories.slice(0, 6).map(cat => (
                  <Link key={cat} to={`/category/${encodeURIComponent(cat)}`} className="text-xs hover:text-accent transition-colors">
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">ติดตามเรา</h3>
              <p className="text-sm text-primary-foreground/70">
                อัปเดตดีลใหม่ๆ ทุกวันผ่านหน้าเว็บไซต์ของเรา
              </p>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/50">
            © 2026 {settings.siteName} — All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
