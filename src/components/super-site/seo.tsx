import type { Metadata } from "next";
import { brand, configuredSocialLinks } from "@/config/brand";
import { absoluteUrl, SITE_URL } from "@/config/site";
import { getCategory } from "@/lib/categories";
import type { TemplateMeta } from "@/templates/types";

/**
 * SEO helpers for the marketing site: per-page metadata (canonical + Open Graph + Twitter)
 * and schema.org JSON-LD builders. Server-only by nature (no hooks), safe to import anywhere.
 */

type JsonLdObject = Record<string, unknown>;

/** Renders one or more schema.org objects. `<` is escaped so untrusted strings cannot close the script. */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const list = Array.isArray(data) ? data : [data];
  const payload = list.length === 1 ? list[0] : list;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\\u003c") }} />;
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const OG_IMAGE_PATH = "/opengraph-image";

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Path of the canonical URL, e.g. "/pricing". */
  path: string;
  /** Absolute or root-relative image; defaults to the site OG image. */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
}

/** Standard metadata for a public page: canonical, OG and Twitter that all agree. */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const image = input.image || OG_IMAGE_PATH;
  const alt = input.imageAlt ?? input.title;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: input.type ?? "website",
      siteName: brand.name,
      locale: "en_PK",
      url: input.path,
      title: input.title,
      description: input.description,
      images: [{ url: image, width: 1200, height: 630, alt }],
      ...(input.type === "article" ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime, authors: [SITE_URL] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [{ url: image, alt }],
    },
    ...(input.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/* ───────────────────────── schema.org builders ───────────────────────── */

export function organizationJsonLd(): JsonLdObject {
  const sameAs = configuredSocialLinks();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: brand.name,
    legalName: brand.legalName,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    image: absoluteUrl(OG_IMAGE_PATH),
    description: brand.description,
    email: brand.supportEmail,
    telephone: brand.supportPhone,
    address: {
      "@type": "PostalAddress",
      addressLocality: brand.addressLocality,
      addressRegion: brand.addressRegion,
      addressCountry: brand.addressCountry,
    },
    areaServed: { "@type": "Country", name: "Pakistan" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: brand.supportPhone,
        email: brand.supportEmail,
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function webSiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: brand.name,
    description: brand.tagline,
    inLanguage: ["en", "ur"],
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function templatePath(t: Pick<TemplateMeta, "category" | "id">) {
  return `/templates/${t.category}/${t.id}`;
}

/** A template is sold as a product (the website package); price = the entry plan. */
export function templateProductJsonLd(t: TemplateMeta, offer: { monthlyPrice: number; setupPrice: number }): JsonLdObject {
  const category = getCategory(t.category);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(templatePath(t))}#product`,
    name: `${t.name} — ${category?.name ?? t.category} website template (#${t.code})`,
    sku: String(t.code),
    productID: t.id,
    url: absoluteUrl(templatePath(t)),
    image: absoluteUrl(`${templatePath(t)}/opengraph-image`),
    description: t.description,
    category: category?.name ?? t.category,
    brand: { "@type": "Brand", name: brand.name },
    manufacturer: { "@id": ORGANIZATION_ID },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Template code", value: String(t.code) },
      { "@type": "PropertyValue", name: "Style", value: t.style.join(", ") },
      { "@type": "PropertyValue", name: "Editable sections", value: String(t.sections.length) },
      { "@type": "PropertyValue", name: "Languages", value: "English, Urdu" },
    ],
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/pricing"),
      priceCurrency: "PKR",
      price: offer.monthlyPrice,
      priceSpecification: [
        { "@type": "UnitPriceSpecification", price: offer.monthlyPrice, priceCurrency: "PKR", unitText: "MONTH", name: "Monthly subscription" },
        { "@type": "UnitPriceSpecification", price: offer.setupPrice, priceCurrency: "PKR", name: "One-time setup" },
      ],
      availability: "https://schema.org/InStock",
      areaServed: "PK",
      seller: { "@id": ORGANIZATION_ID },
    },
  };
}

/** The platform itself, once, on the home page. */
export function softwareApplicationJsonLd(offer: { monthlyPrice: number }): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: brand.description,
    inLanguage: ["en", "ur"],
    offers: { "@type": "Offer", price: offer.monthlyPrice, priceCurrency: "PKR", url: absoluteUrl("/pricing") },
    publisher: { "@id": ORGANIZATION_ID },
    featureList: ["Cash on delivery checkout", "WhatsApp enquiries", "English and Urdu", "Admin panel", "Custom domain", "Managed hosting and SSL"],
  };
}

export interface ArticleInput {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  authorName?: string;
  tags?: string[];
  section?: string;
  wordCount?: number;
}

export function articleJsonLd(a: ArticleInput): JsonLdObject {
  const iso = (d?: Date | string | null) => (d ? new Date(d).toISOString() : undefined);
  const url = absoluteUrl(a.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: a.title.slice(0, 110),
    description: a.description,
    image: [a.image ? (a.image.startsWith("http") ? a.image : absoluteUrl(a.image)) : absoluteUrl(OG_IMAGE_PATH)],
    datePublished: iso(a.publishedAt),
    dateModified: iso(a.updatedAt ?? a.publishedAt),
    author: { "@type": "Organization", name: a.authorName || brand.name, url: SITE_URL },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
    ...(a.section ? { articleSection: a.section } : {}),
    ...(a.tags?.length ? { keywords: a.tags.join(", ") } : {}),
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
  };
}

export function faqJsonLd(faq: { q: string; a: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function itemListJsonLd(name: string, items: { name: string; path: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: absoluteUrl(it.path) })),
  };
}

/** Estimated reading time in whole minutes (200 wpm, min 1). */
export function readingTime(text: string): { minutes: number; words: number } {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return { minutes: Math.max(1, Math.round(words / 200)), words };
}
