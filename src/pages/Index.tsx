import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { SearchBar } from "@/components/SearchBar";
import { KeywordTags } from "@/components/KeywordTags";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterBar, type SortOption } from "@/components/FilterBar";
import { PaginationBar } from "@/components/PaginationBar";
import { CompareTable } from "@/components/CompareTable";
import { PriceAlertBanner } from "@/components/PriceAlertBanner";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { FakePurchasePopup } from "@/components/FakePurchasePopup";
import { useProducts } from "@/hooks/useProducts";
import { getAdminSettings } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tag, ShoppingBag, Sparkles } from "lucide-react";

const Index = () => {
  const settings = getAdminSettings();
  const [keyword, setKeyword] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("default");
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();

  const activeKeyword = keyword || activeTag;
  const { data, isLoading } = useProducts(activeKeyword, undefined, page);

  const handleSearch = (kw: string) => {
    setKeyword(kw);
    setActiveTag("");
    setPage(1);
  };

  const handleTagSelect = (kw: string) => {
    setActiveTag(kw);
    setKeyword("");
    setPage(1);
  };

  const handlePriceRange = (min: number | undefined, max: number | undefined) => {
    setPriceMin(min);
    setPriceMax(max);
  };

  const filteredProducts = useMemo(() => {
    if (!data?.data) return [];
    let items = [...data.data];

    if (priceMin !== undefined) {
      items = items.filter((p) => {
        const price = p.product_discounted || p.product_price;
        return price >= priceMin;
      });
    }
    if (priceMax !== undefined) {
      items = items.filter((p) => {
        const price = p.product_discounted || p.product_price;
        return price <= priceMax;
      });
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

  // Group products by category for display
  const categoryGroups = useMemo(() => {
    if (!filteredProducts.length || activeKeyword) return [];
    const groups: Record<string, typeof filteredProducts> = {};
    for (const p of filteredProducts) {
      const cat = p.category_name || "อื่นๆ";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    
    // Randomize category order for Mass Site uniqueness
    return Object.entries(groups).sort(() => Math.random() - 0.5);
  }, [filteredProducts, activeKeyword]);

  return (
    <div className="min-h-screen bg-background">
      <PriceAlertBanner />
      <SEOHead 
        title={`${settings.siteName} - ดีลเด็ด ราคาโดน ช้อปเลยวันนี้`}
        description={`รวบรวมสินค้าจาก ${settings.categories.join(", ")} ราคาถูกที่สุด พร้อมส่วนลดพิเศษที่ ${settings.siteName}`}
      />
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-5">
        {/* Recently Viewed */}
        <RecentlyViewed />
        
        {/* Hero section - Lazada Style */}
        <div className="rounded-2xl bg-gradient-to-r from-[#000080] to-[#f36f21] px-6 py-10 text-center animate-fade-in relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <ShoppingBag className="h-32 w-32 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white sm:text-4xl relative tracking-tight">
            {settings.siteName}
          </h1>
          <p className="mt-3 text-base text-white/90 relative font-medium">
            ดีลเด็ด ราคาโดน ช้อปเลยที่ {settings.siteName}
          </p>
          <div className="mt-6 flex justify-center relative">
            <SearchBar onSearch={handleSearch} initialValue={keyword} />
          </div>
        </div>

        <KeywordTags
          keywords={settings.keywords}
          onSelect={handleTagSelect}
          active={activeTag}
        />

        {/* Categories */}
        {settings.categories.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              หมวดหมู่ยอดนิยม
            </h2>
            <div className="flex flex-wrap gap-2">
              {settings.categories.map((cat) => (
                <Link key={cat} to={`/category/${encodeURIComponent(cat)}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-4 py-1.5 rounded-full">
                    {cat}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        <FilterBar onPriceRange={handlePriceRange} onSort={setSort} sort={sort} />

        {/* Show by category when not searching */}
        {!activeKeyword && categoryGroups.length > 0 ? (
          <div className="space-y-10">
            {categoryGroups.map(([catName, products]) => (
              <div key={catName} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <div className="w-1 h-6 bg-accent rounded-full" />
                    {catName}
                    <span className="text-sm font-normal text-muted-foreground">({products.length})</span>
                  </h2>
                  <Link
                    to={`/category/${encodeURIComponent(catName)}`}
                    className="text-sm font-medium text-primary hover:text-accent transition-colors"
                  >
                    ดูทั้งหมด →
                  </Link>
                </div>
                {/* Randomize product order within category for uniqueness */}
                <ProductGrid products={[...products].sort(() => Math.random() - 0.5).slice(0, 10)} isLoading={false} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Tabs: Grid vs Compare */}
            <Tabs defaultValue="grid">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  {activeKeyword ? (
                    `ผลการค้นหา "${activeKeyword}"`
                  ) : (
                    <><Sparkles className="h-5 w-5 text-accent" /> สินค้าแนะนำสำหรับคุณ</>
                  )}
                </h2>
                <div className="flex items-center gap-3">
                  {data && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {filteredProducts.length} รายการ
                    </span>
                  )}
                  <TabsList className="h-9 bg-muted/50">
                    <TabsTrigger value="grid" className="text-xs px-4">ตาราง</TabsTrigger>
                    <TabsTrigger value="compare" className="text-xs px-4">เปรียบเทียบ</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="grid">
                <ProductGrid products={filteredProducts} isLoading={isLoading} />
              </TabsContent>
              <TabsContent value="compare">
                {filteredProducts.length > 0 ? (
                  <CompareTable products={filteredProducts} />
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <p className="text-muted-foreground">ไม่มีสินค้าให้เปรียบเทียบในขณะนี้</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {data && (
              <PaginationBar
                currentPage={page}
                totalItems={data.meta.total}
                itemsPerPage={20}
                onPageChange={setPage}
              />
            )}
          </>
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

      {/* Fake Purchase Popup */}
      <FakePurchasePopup products={filteredProducts} />
    </div>
  );
};

export default Index;
