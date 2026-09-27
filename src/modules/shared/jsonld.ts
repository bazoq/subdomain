import type { Job, Property, Service, TeamMember, TenantPost, TravelPackage } from "@/generated/prisma/client";
import { t, type Lang, type LocalizedString } from "@/lib/i18n";
import type { TenantContext } from "@/server/tenant";
import { businessId, tenantUrl, type JsonLdObject } from "@/server/site-seo";

/**
 * schema.org JSON-LD builders for module detail pages. Only validated values are emitted: absolute http(s)
 * image URLs, ISO dates, integer PKR amounts. Text comes from the tenant and is whitespace-collapsed and
 * truncated; `<JsonLd>` escapes `<` so no string can close the script element.
 */

const CONTEXT = "https://schema.org";
const IN_STOCK = "https://schema.org/InStock";

/** Drop empty values (schema validators flag `null` / `""` / `[]`). */
export function compactJsonLd<T extends Record<string, unknown>>(o: T): JsonLdObject {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)));
}

/** Localized (or plain) text as a single line, truncated. */
export function plainText(v: LocalizedString | string | null | undefined, lang: Lang, max = 5000): string | undefined {
  const s = t(v, lang).replace(/\s+/g, " ").trim();
  if (!s) return undefined;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Absolute http(s) image URLs only (relative or data: URLs are dropped). */
export function absoluteImages(urls: readonly (string | null | undefined)[]): string[] {
  return urls.filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u));
}

function isoDate(d: Date | null | undefined): string | undefined {
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : undefined;
}

function organizationRef(tc: TenantContext): JsonLdObject {
  return { "@type": "Organization", "@id": businessId(tc), name: tc.tenant.name };
}

/* ───────────────────────── recruiting ───────────────────────── */

const EMPLOYMENT_TYPE: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  Remote: "FULL_TIME",
  Overseas: "FULL_TIME",
};

/** JobPosting for `/jobs/[slug]`. Salary is integer PKR per month. */
export function jobPostingJsonLd(tc: TenantContext, job: Job, lang: Lang): JsonLdObject {
  const title = plainText(job.title as LocalizedString, lang, 200) ?? "Job";
  const hasSalary = job.salaryMin != null || job.salaryMax != null;
  return compactJsonLd({
    "@context": CONTEXT,
    "@type": "JobPosting",
    title,
    description: plainText(job.description as LocalizedString, lang) ?? title,
    identifier: { "@type": "PropertyValue", name: tc.tenant.name, value: job.id },
    url: tenantUrl(tc, `/jobs/${job.slug}`),
    datePosted: isoDate(job.createdAt),
    validThrough: isoDate(job.deadline),
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "FULL_TIME",
    jobLocationType: job.type === "Remote" ? "TELECOMMUTE" : undefined,
    hiringOrganization: job.company ? { "@type": "Organization", name: job.company } : organizationRef(tc),
    jobLocation: {
      "@type": "Place",
      address: compactJsonLd({ "@type": "PostalAddress", addressLocality: job.location, addressCountry: job.country || "Pakistan" }),
    },
    baseSalary: hasSalary
      ? {
          "@type": "MonetaryAmount",
          currency: "PKR",
          value: compactJsonLd({ "@type": "QuantitativeValue", minValue: job.salaryMin ?? undefined, maxValue: job.salaryMax ?? undefined, unitText: "MONTH" }),
        }
      : undefined,
    experienceRequirements: job.experience ?? undefined,
    industry: job.department ?? undefined,
    totalJobOpenings: job.vacancies > 0 ? job.vacancies : undefined,
    directApply: true,
  });
}

/* ───────────────────────── travel ───────────────────────── */

/** Product + Offer for `/packages/[slug]` (price is integer PKR per person). */
export function packageJsonLd(tc: TenantContext, pkg: TravelPackage, lang: Lang): JsonLdObject {
  const name = plainText(pkg.title as LocalizedString, lang, 200) ?? pkg.destination;
  const url = tenantUrl(tc, `/packages/${pkg.slug}`);
  return compactJsonLd({
    "@context": CONTEXT,
    "@type": "Product",
    name,
    description: plainText(pkg.summary as LocalizedString, lang),
    image: absoluteImages(pkg.images),
    url,
    category: pkg.kind,
    brand: organizationRef(tc),
    additionalProperty: [
      { "@type": "PropertyValue", name: "Destination", value: pkg.destination },
      { "@type": "PropertyValue", name: "Duration", value: `${pkg.days} days / ${pkg.nights} nights` },
    ],
    offers: compactJsonLd({
      "@type": "Offer",
      url,
      price: pkg.price,
      priceCurrency: "PKR",
      availability: IN_STOCK,
      description: pkg.priceNote ?? undefined,
      seller: organizationRef(tc),
    }),
  });
}

/* ───────────────────────── real estate ───────────────────────── */

const PLACE_TYPE: Record<string, string> = { HOUSE: "House", FLAT: "Apartment", FARMHOUSE: "House", PLOT: "Place", COMMERCIAL: "Place" };
const AREA_UNIT_TEXT: Record<string, string> = { MARLA: "Marla", KANAL: "Kanal", SQFT: "sq ft", SQYD: "sq yd" };

/** Offer + Place for `/properties/[slug]`. Rent is a monthly UnitPriceSpecification. */
export function propertyJsonLd(tc: TenantContext, p: Property, lang: Lang): JsonLdObject {
  const name = plainText(p.title as LocalizedString, lang, 200) ?? p.location;
  const url = tenantUrl(tc, `/properties/${p.slug}`);
  const images = absoluteImages(p.images);
  const monthly = p.priceUnit === "MONTHLY" || p.purpose === "RENT";
  const place = compactJsonLd({
    "@type": PLACE_TYPE[p.type] ?? "Place",
    name,
    url,
    image: images,
    address: compactJsonLd({ "@type": "PostalAddress", streetAddress: p.location, addressLocality: p.city, addressCountry: "PK" }),
    numberOfRooms: p.bedrooms ?? undefined,
    numberOfBathroomsTotal: p.bathrooms ?? undefined,
    floorSize: p.areaValue && p.areaValue > 0 ? { "@type": "QuantitativeValue", value: p.areaValue, unitText: AREA_UNIT_TEXT[p.areaUnit] ?? p.areaUnit } : undefined,
    amenityFeature: p.features.slice(0, 30).map((f) => ({ "@type": "LocationFeatureSpecification", name: f, value: true })),
  });
  return compactJsonLd({
    "@context": CONTEXT,
    "@type": "Offer",
    name,
    description: plainText(p.description as LocalizedString, lang),
    url,
    image: images,
    price: p.price,
    priceCurrency: "PKR",
    priceSpecification: monthly ? { "@type": "UnitPriceSpecification", price: p.price, priceCurrency: "PKR", unitCode: "MON" } : undefined,
    businessFunction: p.purpose === "RENT" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
    availability: IN_STOCK,
    seller: organizationRef(tc),
    itemOffered: place,
  });
}

/* ───────────────────────── shared content ───────────────────────── */

/** BlogPosting for `/blog/[slug]`. */
export function blogPostingJsonLd(tc: TenantContext, post: TenantPost, lang: Lang): JsonLdObject {
  const url = tenantUrl(tc, `/blog/${post.slug}`);
  const org = organizationRef(tc);
  return compactJsonLd({
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: plainText(post.title as LocalizedString, lang, 110),
    description: plainText(post.excerpt as LocalizedString, lang, 300),
    image: absoluteImages([post.coverUrl]),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: isoDate(post.publishedAt ?? post.createdAt),
    dateModified: isoDate(post.updatedAt),
    inLanguage: lang,
    author: org,
    publisher: org,
  });
}

/** Service for `/services/[slug]` (optional "from" price in PKR). */
export function serviceJsonLd(tc: TenantContext, s: Service, lang: Lang): JsonLdObject {
  const url = tenantUrl(tc, `/services/${s.slug}`);
  return compactJsonLd({
    "@context": CONTEXT,
    "@type": "Service",
    name: plainText(s.name as LocalizedString, lang, 200),
    description: plainText(s.summary as LocalizedString, lang) ?? plainText(s.description as LocalizedString, lang, 1000),
    url,
    image: absoluteImages([s.imageUrl]),
    provider: organizationRef(tc),
    areaServed: { "@type": "Country", name: "Pakistan" },
    offers: s.priceFrom != null ? compactJsonLd({ "@type": "Offer", url, price: s.priceFrom, priceCurrency: "PKR", description: s.priceNote ?? undefined }) : undefined,
  });
}

/** Person for `/team/[slug]` (public profile fields only — no phone / e-mail). */
export function personJsonLd(tc: TenantContext, m: TeamMember, lang: Lang): JsonLdObject {
  return compactJsonLd({
    "@context": CONTEXT,
    "@type": "Person",
    name: m.name,
    jobTitle: plainText(m.role as LocalizedString, lang, 200),
    description: plainText(m.bio as LocalizedString, lang, 1000),
    image: absoluteImages([m.imageUrl]),
    url: tenantUrl(tc, `/team/${m.slug}`),
    worksFor: organizationRef(tc),
    knowsAbout: m.specialties.slice(0, 20),
  });
}

/** FAQPage for `/faq`. */
export function faqPageJsonLd(faqs: readonly { question: unknown; answer: unknown }[], lang: Lang): JsonLdObject | null {
  const items = faqs
    .map((f) => ({ q: plainText(f.question as LocalizedString, lang, 300), a: plainText(f.answer as LocalizedString, lang, 2000) }))
    .filter((x): x is { q: string; a: string } => Boolean(x.q && x.a));
  if (!items.length) return null;
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };
}
