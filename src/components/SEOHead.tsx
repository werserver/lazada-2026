import { Helmet } from "react-helmet-async";
import { getAdminSettings } from "@/lib/store";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
  breadcrumbs?: { name: string; url: string }[];
  product?: {
    name: string;
    price: number;
    currency: string;
    image: string;
    rating: number;
    reviewCount: number;
    availability?: string;
  };
}

export function SEOHead({
  title,
  description = "รวมสินค้าลดราคา โปรโมชั่นสุดคุ้ม จากร้านค้าชั้นนำ",
  image,
  url,
  type = "website",
  canonical,
  breadcrumbs,
  product,
}: SEOHeadProps) {
  const settings = getAdminSettings();
  const siteName = settings.siteName || "ThaiDeals";
  const favicon = settings.faviconUrl || "/favicon.ico";
  
  const defaultTitle = `${siteName} — สินค้าดีลพิเศษ`;
  const currentTitle = title || defaultTitle;
  const fullTitle = currentTitle.includes(siteName) ? currentTitle : `${currentTitle} | ${siteName}`;
  
  const pageUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const canonicalUrl = canonical || pageUrl;

  const jsonLdItems: object[] = [];

  if (product) {
    jsonLdItems.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.image,
      description: description.slice(0, 160),
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: product.currency,
        availability: product.availability || "https://schema.org/InStock",
        url: pageUrl,
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    });
  } else {
    jsonLdItems.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      description,
      url: pageUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${typeof window !== "undefined" ? window.location.origin : ""}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  }

  if (breadcrumbs?.length) {
    jsonLdItems.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description.slice(0, 160)} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="icon" href={favicon} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description.slice(0, 160)} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="th_TH" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description.slice(0, 160)} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD */}
      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(item)}</script>
      ))}
    </Helmet>
  );
}
