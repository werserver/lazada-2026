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
import { Star, ArrowLeft, ShoppingCart, Shield, Truck } from "lucide-react";
import {
  fetchProducts,
  getCachedProduct,
  getProductRating,
  getProductReviews,
  formatPrice,
  type Product,
} from "@/lib/api";
import { fetchCsvProducts } from "@/lib/csv-products";
import { fetchSitemapProducts, getSitemapProductById } from "@/lib/sitemap-parser";
import { getAdminSettings } from "@/lib/store";
import { addRecentlyViewed } from "@/lib/wishlist";
import { extractIdFromSlug } from "@/lib/slug";
import { getPrefixedName } from "@/lib/prefix-words";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const id = slug ? extractIdFromSlug(slug) : undefined;
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(
    (location.state as any)?.product || null
  );
  const [loading, setLoading] = useState(!product || (id && product.product_id !== id));
  const settings = getAdminSettings();

  // ✅ แก้ไข: เมื่อ slug เปลี่ยน ให้รีเซ็ตข้อมูลสินค้าและเลื่อนขึ้นบนสุด
  useEffect(() => {
    window.scrollTo(0, 0);
    if (id && product?.product_id !== id) {
      setProduct(null);
      setLoading(true);
    }
  }, [id]);

  useEffect(() => {
    if (!id || (product && product.product_id === id)) return;

    // 1. ลองดึงจาก Cache ของ Sitemap ก่อนถ้าใช้แหล่งข้อมูล Sitemap
    if (settings.dataSource === "sitemap") {
      const sitemapProduct = getSitemapProductById(id);
      if (sitemapProduct) {
        setProduct(sitemapProduct);
        setLoading(false);
        return;
      }
    }

    // 2. ลองดึงจาก Cache ทั่วไป
    const cached = getCachedProduct(id);
    if (cached) {
      setProduct(cached);
      setLoading(false);
      return;
    }

    // 3. ดึงจากแหล่งข้อมูลที่ถูกต้อง
    setLoading(true);
    
    const getFetchFn = () => {
      if (settings.dataSource === "sitemap") return fetchSitemapProducts({ limit: 1000 });
      if (settings.dataSource === "csv") return fetchCsvProducts({ limit: 100, page: 1 });
      return fetchProducts({ limit: 100, page: 1 });
    };

    getFetchFn()
      .then((res) => {
        const found = res.data.find((p) => p.product_id === id);
        setProduct(found || null);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id, product, settings.dataSource]);

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

  // Track recently viewed
  addRecentlyViewed(product);

  const { rating, reviewCount } = getProductRating(product.product_id);
  const reviews = getProductReviews(product.product_id);
  const hasDiscount = product.product_discounted_percentage > 0;
  const currentPrice = hasDiscount ? product.product_discounted : product.product_price;
  const displayName = settings.enablePrefixWords
    ? getPrefixedName(product.product_id, product.product_name)
    : product.product_name;

  const images = [product.product_picture];
  if (product.product_other_pictures) {
    product.product_other_pictures.split(",").forEach((img) => {
      const trimmed = img.trim();
      if (trimmed && !images.includes(trimmed)) images.push(trimmed);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={displayName}
        description={`${displayName} — ${formatPrice(currentPrice, product.product_currency)} | ${product.category_name}`}
        image={product.product_picture}
        type="product"
        url={window.location.href}
        product={{
          name: displayName,
          price: currentPrice,
          currency: product.product_currency,
          image: product.product_picture,
          rating,
          reviewCount,
        }}
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
              <div className="overflow-hidden rounded-xl border bg-muted aspect-square group">
                <img
                  src={images[0]}
                  alt={displayName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </a>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1, 5).map((img, idx) => (
                  <a
                    key={idx}
                    href={product.tracking_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-lg border bg-muted aspect-square group"
                  >
                    <img
                      src={img}
                      alt={`${displayName} ${idx + 2}`}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <Link to={`/category/${encodeURIComponent(product.category_name)}`}>
                <Badge variant="secondary" className="mb-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  {product.category_name}
                </Badge>
              </Link>
              <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                {displayName}
              </h1>
            </div>

            <StarRating rating={rating} count={reviewCount} />

            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(currentPrice, product.product_currency)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.product_price, product.product_currency)}
                    </span>
                    <Badge className="bg-sale text-primary-foreground border-0">
                      -{product.product_discounted_percentage}%
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Flash Sale Countdown */}
            {settings.enableFlashSale && hasDiscount && (
              <FlashSaleCountdown productId={product.product_id} />
            )}

            {/* Trust badges */}
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
              <Button size="lg" className="w-full gap-2 text-base hover-scale shadow-lg shadow-primary/20">
                <ShoppingCart className="h-5 w-5" />
                สั่งซื้อสินค้านี้
              </Button>
            </a>

            {/* Share Buttons */}
            <ShareButtons url={window.location.href} title={displayName} />
          </div>
        </div>

        {/* Variations */}
        {product.variations && (
          <div className="rounded-xl border bg-card p-6 space-y-3 animate-fade-in">
            <h2 className="text-lg font-bold">ตัวเลือกสินค้า</h2>
            <div className="flex flex-wrap gap-2">
              {product.variations.split(",").map((v, i) => {
                const trimmed = v.trim().replace(/^[^:]+:\s*/, "");
                if (!trimmed) return null;
                return (
                  <Badge key={i} variant="outline" className="text-sm py-1.5 px-3">
                    {trimmed}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Details Section */}
        <div className="rounded-xl border bg-card p-6 space-y-4 animate-fade-in shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            ข้อมูลสินค้า
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: "ชื่อสินค้า", value: displayName },
              { label: "หมวดหมู่", value: product.category_name },
              { label: "ร้านค้า", value: product.shop_id },
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

        {/* Compare Table */}
        <FakeCompareTable product={product} />

        {/* AI Reviews */}
        {settings.enableAiReviews && (
          <AiReviews productId={product.product_id} productName={displayName} />
        )}

        {/* Related Products */}
        <RelatedProducts currentProductId={product.product_id} categoryName={product.category_name} />
      </main>
    </div>
  );
}
