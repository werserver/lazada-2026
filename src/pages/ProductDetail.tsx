import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { StarRating } from "@/components/StarRating";
import { ShareButtons } from "@/components/ShareButtons";
import { FlashSaleCountdown } from "@/components/FlashSaleCountdown";
import { AiReviews } from "@/components/AiReviews";
import { FakeCompareTable } from "@/components/FakeCompareTable";
import { RelatedProducts } from "@/components/RelatedProducts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ArrowLeft, ShoppingCart, Shield, Truck, Store } from "lucide-react";
import {
  fetchProducts,
  getCachedProduct,
  getProductRating,
  formatPrice,
  type Product,
} from "@/lib/api";
import { fetchCsvProducts, fetchProductById } from "@/lib/csv-products";
import { fetchSitemapProducts, getSitemapProductById } from "@/lib/sitemap-parser";
import { getAdminSettings } from "@/lib/store";
import { addRecentlyViewed } from "@/lib/wishlist";
import { extractIdFromSlug } from "@/lib/slug";
import { getPrefixedName } from "@/lib/prefix-words";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const id = slug ? extractIdFromSlug(slug) : undefined;
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(
    (location.state as any)?.product || null
  );
  const [loading, setLoading] = useState(!product || (id && product.product_id !== id));
  const settings = getAdminSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id && product?.product_id !== id) {
      setProduct(null);
      setLoading(true);
    }
  }, [id]);

  useEffect(() => {
    if (!id || (product && product.product_id === id)) return;

    const loadProduct = async () => {
      setLoading(true);
      let found: Product | null = null;

      try {
        // 1. ลองดึงจาก CSV Global Search (High Priority for Mass Site)
        if (settings.dataSource === "csv") {
          found = await fetchProductById(id);
        }

        // 2. ลองดึงจาก Sitemap Cache
        if (!found && settings.dataSource === "sitemap") {
          found = getSitemapProductById(id, slug);
        }

        // 3. ถ้ายังไม่เจอ ลองดึงจาก Cache ทั่วไป
        if (!found) {
          found = getCachedProduct(id);
        }

        // 4. ถ้ายังไม่เจออีก ให้ดึงจากแหล่งข้อมูลจริง
        if (!found) {
          const getFetchFn = () => {
            if (settings.dataSource === "sitemap") return fetchSitemapProducts({ limit: 1000 });
            if (settings.dataSource === "csv") return fetchCsvProducts({ limit: 100, page: 1 });
            return fetchProducts({ limit: 100, page: 1 });
          };

          const res = await getFetchFn();
          found = res.data.find((p) => p.product_id === id) || null;
        }

        setProduct(found);
      } catch (error) {
        console.error("Error loading product:", error);
        toast.error("ไม่สามารถโหลดข้อมูลสินค้าได้");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, slug, settings.dataSource]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="ไม่พบสินค้า" description="ไม่พบสินค้าที่คุณกำลังค้นหา" />
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="text-xl font-medium text-muted-foreground">ไม่พบสินค้า (ID: {id})</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            กลับหน้าแรก
          </Link>
        </main>
      </div>
    );
  }

  addRecentlyViewed(product);

  const { rating, reviewCount } = getProductRating(product.product_id);
  const hasDiscount = product.product_discounted_percentage > 0;
  const currentPrice = hasDiscount ? product.product_discounted : product.product_price;
  const displayName = settings.enablePrefixWords
    ? getPrefixedName(product.product_id, product.product_name)
    : product.product_name;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={displayName}
        description={`${displayName} — ${formatPrice(currentPrice, product.product_currency)} | ${product.category_name}`}
        image={product.product_picture}
        type="product"
        url={window.location.href}
      />
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-6 space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าแรก
        </Link>

        <div className="grid gap-8 md:grid-cols-2 animate-fade-in">
          {/* Images */}
          <div className="space-y-3">
            <a href={product.tracking_link} target="_blank" rel="noopener noreferrer">
              <div className="overflow-hidden rounded-xl border bg-white aspect-square group shadow-sm">
                <img
                  src={product.product_picture}
                  alt={displayName}
                  className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </a>
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-none">
                {product.advertiser_id || "Lazada"}
              </Badge>
              <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                {displayName}
              </h1>
            </div>

            <StarRating rating={rating} count={reviewCount} />

            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-accent">
                  {formatPrice(currentPrice, product.product_currency)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.product_price, product.product_currency)}
                    </span>
                    <Badge className="bg-accent text-white border-0">
                      -{product.product_discounted_percentage}%
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {settings.enableFlashSale && hasDiscount && (
              <FlashSaleCountdown productId={product.product_id} />
            )}

            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, text: "สินค้าแท้ 100%" },
                { icon: Truck, text: "จัดส่งฟรี" },
                { icon: ShoppingCart, text: "สั่งซื้อง่าย" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {text}
                </div>
              ))}
            </div>

            <a
              href={product.tracking_link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full h-14 gap-2 text-lg font-bold hover-scale shadow-lg shadow-primary/20">
                <ShoppingCart className="h-5 w-5" />
                สั่งซื้อสินค้านี้
              </Button>
            </a>

            <ShareButtons url={window.location.href} title={displayName} />
          </div>
        </div>

        {/* Product Details Section */}
        <div className="rounded-xl border bg-card p-6 space-y-4 animate-fade-in shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            ข้อมูลร้านค้าและสินค้า
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: "ชื่อสินค้า", value: displayName },
              { label: "หมวดหมู่", value: product.category_name || "ทั่วไป" },
              { label: "ร้านค้า", value: product.shop_id || "Lazada Official Store" },
              { label: "ราคาปกติ", value: formatPrice(product.product_price, product.product_currency) },
              ...(hasDiscount
                ? [
                    { label: "ราคาพิเศษ", value: formatPrice(product.product_discounted, product.product_currency) },
                    { label: "ส่วนลด", value: `${product.product_discounted_percentage}%` },
                  ]
                : []),
            ].map((item) => (
              <div key={item.label} className="flex justify-between border-b pb-2 sm:border-0 sm:pb-0">
                <span className="text-muted-foreground">{item.label}:</span>
                <span className="font-medium text-right ml-4">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <FakeCompareTable product={product} />

        {settings.enableAiReviews && (
          <AiReviews productId={product.product_id} productName={displayName} />
        )}

        <RelatedProducts currentProductId={product.product_id} categoryName={product.category_name} />
      </main>
      
      <FakePurchasePopup products={[product]} />
    </div>
  );
}
