import type { TenantContext } from "@/server/tenant";
import { businessId, tenantUrl, type JsonLdObject } from "@/server/site-seo";
import { t, type Lang } from "@/lib/i18n";
import { safeExternalUrl } from "@/lib/utils";
import type { ProductDTO } from "./types";

/** Drop undefined / null / empty-array values so the emitted JSON-LD only contains real data. */
function compact(obj: Record<string, unknown>): JsonLdObject {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)));
}

/** Absolute http(s) image URLs only (search engines ignore relative or unsafe values). */
export function absoluteImages(urls: (string | null | undefined)[]): string[] {
  return Array.from(new Set(urls.map((u) => safeExternalUrl(u)).filter((u): u is string => Boolean(u))));
}

const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";

/**
 * schema.org Product for `/shop/[slug]` with PKR offers. Variants become an AggregateOffer (low/high price);
 * availability follows the same rule as the storefront badge (untracked stock is always "in stock").
 */
export function productJsonLd(tc: TenantContext, p: ProductDTO, lang: Lang, host: string = tc.host): JsonLdObject {
  const url = tenantUrl(tc, `/shop/${p.slug}`, host);
  const variants = p.variants.filter((v) => v.isActive);
  const prices = variants.length ? variants.map((v) => v.price ?? p.price) : [p.price];
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const inStock = !p.trackStock || (variants.length ? variants.some((v) => v.stock > 0) : p.stock > 0);
  const availability = inStock ? IN_STOCK : OUT_OF_STOCK;
  const seller = { "@id": businessId(tc, host) };
  const offers =
    low === high
      ? compact({ "@type": "Offer", url, price: low, priceCurrency: "PKR", availability, itemCondition: "https://schema.org/NewCondition", seller })
      : compact({ "@type": "AggregateOffer", url, lowPrice: low, highPrice: high, offerCount: variants.length, priceCurrency: "PKR", availability, seller });
  const description = p.seo.description?.trim() || t(p.shortDesc, lang).trim() || undefined;
  return compact({
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: t(p.name, lang),
    description: description ? description.slice(0, 300) : undefined,
    image: absoluteImages([...p.images, ...p.variants.map((v) => v.imageUrl)]),
    sku: p.sku ?? undefined,
    url,
    category: p.category ? t(p.category.name, lang) : undefined,
    brand: p.manufacturer ? { "@type": "Brand", name: p.manufacturer } : undefined,
    offers,
  });
}
