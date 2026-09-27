import "server-only";
import type { Metadata, MetadataRoute, Viewport } from "next";
import { db } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { hostUrl } from "@/config/site";
import { brand } from "@/config/brand";
import type { CategoryKey } from "@/lib/categories";
import type { Lang } from "@/lib/i18n";
import { ogLocale, otherLang } from "@/lib/i18n";
import { log, errorFields } from "@/lib/log";
import { normalizePkPhone, safeExternalUrl, safeImageSrc, truncate } from "@/lib/utils";
import { getTemplateMeta } from "@/templates/registry";
import { safeHex, themePrimary } from "@/templates/theme";

/**
 * Per-tenant SEO: sitemap, robots, web manifest, base metadata, viewport and schema.org JSON-LD.
 *
 * Hosts: tenant requests for `/sitemap.xml`, `/robots.txt` and `/manifest.webmanifest` are rewritten by
 * `src/proxy.ts` to `/_sites/<host>/…`, where the route handlers next to the tenant layout call the
 * builders below. The root `src/app/{sitemap,robots,manifest}.ts` (super-site stream) may import the same
 * builders for the platform-host code path — the signatures accept `(tc, host?)` for that reason.
 *
 * Every value that ends up in a URL, `<meta>` or JSON-LD comes from the tenant database and is
 * validated here (`safeExternalUrl`, `safeImageSrc`, `safeHex`, `normalizePkPhone`) before use.
 */

/* ───────────────────────── visibility ───────────────────────── */

/** A tenant may be crawled/indexed only when it is live and not a demo. */
export function tenantIsIndexable(tc: TenantContext): boolean {
  return tc.tenant.status === "ACTIVE" && !tc.tenant.isDemo;
}

/** Absolute origin of a tenant site (no trailing slash), on the host the request arrived on by default. */
export function tenantOrigin(tc: TenantContext, host: string = tc.host): string {
  return hostUrl(host || tc.host, "/").replace(/\/+$/, "");
}

/** Absolute URL of a path on a tenant site. */
export function tenantUrl(tc: TenantContext, path = "/", host: string = tc.host): string {
  return `${tenantOrigin(tc, host)}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ───────────────────────── public paths ───────────────────────── */

type ModuleKey = TenantContext["category"]["modules"][number];

function hasModule(tc: TenantContext, m: ModuleKey): boolean {
  return tc.category.modules.includes(m);
}

/** Static public paths that exist for a tenant, derived from its category modules (order = priority). */
export function tenantPublicPaths(tc: TenantContext): string[] {
  const paths = ["/", "/contact"];
  const add = (m: ModuleKey, ...p: string[]) => {
    if (hasModule(tc, m)) paths.push(...p);
  };
  add("ecommerce", "/shop");
  add("restaurant", "/menu");
  if (hasModule(tc, "restaurant") && tc.settings.restaurant.reservations) paths.push("/reserve");
  add("recruiting", "/jobs", "/employers");
  add("travel", "/packages");
  add("realestate", "/properties");
  add("gym", "/plans", "/classes", "/join");
  add("law", "/consultation");
  add("printing", "/quote");
  add("medical", "/upload-prescription");
  add("services", "/services");
  add("team", "/team");
  add("gallery", "/gallery");
  add("faq", "/faq");
  add("posts", "/blog");
  return [...new Set(paths)];
}

/** Paths that are never useful in a search index (transactional / private). */
export const TENANT_DISALLOW = ["/admin", "/api/", "/cart", "/checkout", "/order/", "/menu/checkout", "/menu/order/", "/_sites/", "/_next/"];

/* ───────────────────────── sitemap ───────────────────────── */

const MAX_PER_COLLECTION = 5000;
const MAX_ENTRIES = 45000;

type Entry = MetadataRoute.Sitemap[number];
type Freq = NonNullable<Entry["changeFrequency"]>;

function priorityFor(path: string): number {
  if (path === "/") return 1;
  if (["/shop", "/menu", "/jobs", "/packages", "/properties", "/services", "/plans"].includes(path)) return 0.9;
  if (path === "/contact") return 0.6;
  return 0.7;
}

function frequencyFor(path: string): Freq {
  if (path === "/") return "weekly";
  if (["/shop", "/menu", "/jobs", "/blog", "/properties", "/packages"].includes(path)) return "daily";
  if (path === "/contact" || path === "/faq") return "yearly";
  return "monthly";
}

function safeSlug(slug: string): string | null {
  return /^[a-z0-9][a-z0-9._-]{0,120}$/i.test(slug) ? encodeURIComponent(slug) : null;
}

interface Slugged {
  slug: string;
  updatedAt?: Date | null;
}

/**
 * Full sitemap for a tenant: static module paths plus every public detail page (pages, posts, products,
 * product categories, jobs, packages, properties, services, team). Empty for demo / non-active tenants.
 * A database failure degrades to the static entries so `/sitemap.xml` never 500s.
 */
export async function buildTenantSitemap(tc: TenantContext, host: string = tc.host): Promise<MetadataRoute.Sitemap> {
  if (!tenantIsIndexable(tc)) return [];
  const tid = tc.tenant.id;
  const fallbackDate = tc.tenant.updatedAt;
  const url = (p: string) => tenantUrl(tc, p, host);

  const entries: MetadataRoute.Sitemap = tenantPublicPaths(tc).map((path) => ({
    url: url(path),
    lastModified: fallbackDate,
    changeFrequency: frequencyFor(path),
    priority: priorityFor(path),
  }));

  const none: Slugged[] = [];
  const opts = { take: MAX_PER_COLLECTION } as const;
  try {
    const now = new Date();
    const [pages, posts, products, productCats, jobs, packages, properties, services, team] = await Promise.all([
      db.sitePage.findMany({ where: { tenantId: tid, enabled: true }, select: { slug: true, updatedAt: true }, orderBy: { sortOrder: "asc" }, ...opts }),
      hasModule(tc, "posts")
        ? db.tenantPost.findMany({ where: { tenantId: tid, published: true, publishedAt: { lte: now } }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" }, ...opts })
        : none,
      hasModule(tc, "ecommerce") ? db.product.findMany({ where: { tenantId: tid, isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, ...opts }) : none,
      hasModule(tc, "ecommerce") ? db.productCategory.findMany({ where: { tenantId: tid, isActive: true }, select: { slug: true }, ...opts }) : none,
      hasModule(tc, "recruiting") ? db.job.findMany({ where: { tenantId: tid, isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, ...opts }) : none,
      hasModule(tc, "travel") ? db.travelPackage.findMany({ where: { tenantId: tid, isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, ...opts }) : none,
      hasModule(tc, "realestate") ? db.property.findMany({ where: { tenantId: tid, isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, ...opts }) : none,
      hasModule(tc, "services") ? db.service.findMany({ where: { tenantId: tid, isActive: true }, select: { slug: true }, orderBy: { sortOrder: "asc" }, ...opts }) : none,
      hasModule(tc, "team") ? db.teamMember.findMany({ where: { tenantId: tid, isActive: true }, select: { slug: true }, orderBy: { sortOrder: "asc" }, ...opts }) : none,
    ]);

    const push = (rows: Slugged[], prefix: string, freq: Freq, priority: number) => {
      for (const r of rows) {
        const slug = safeSlug(r.slug);
        if (!slug) continue;
        entries.push({ url: url(`${prefix}/${slug}`), lastModified: r.updatedAt ?? fallbackDate, changeFrequency: freq, priority });
      }
    };
    push(pages, "/p", "monthly", 0.5);
    push(posts, "/blog", "monthly", 0.6);
    push(productCats, "/shop/c", "weekly", 0.7);
    push(products, "/shop", "weekly", 0.8);
    push(jobs, "/jobs", "weekly", 0.8);
    push(packages, "/packages", "weekly", 0.8);
    push(properties, "/properties", "weekly", 0.8);
    push(services, "/services", "monthly", 0.7);
    push(team, "/team", "monthly", 0.4);
  } catch (err) {
    log.warn("site-seo: sitemap detail queries failed, serving static entries only", { tenantId: tid, ...errorFields(err) });
  }

  return entries.slice(0, MAX_ENTRIES);
}

/** robots.txt rules for a tenant host: everything for live tenants except transactional paths; nothing otherwise. */
export function buildTenantRobots(tc: TenantContext, host: string = tc.host): MetadataRoute.Robots {
  if (!tenantIsIndexable(tc)) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: TENANT_DISALLOW }],
    sitemap: tenantUrl(tc, "/sitemap.xml", host),
  };
}

/* ───────────────────────── serialisers (route handlers) ───────────────────────── */

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function isoDate(d: Entry["lastModified"]): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** `MetadataRoute.Sitemap` → sitemap.xml document (UTF-8). */
export function sitemapXml(entries: MetadataRoute.Sitemap): string {
  const body = entries
    .map((e) => {
      const parts = [`<loc>${xmlEscape(e.url)}</loc>`];
      const lm = isoDate(e.lastModified);
      if (lm) parts.push(`<lastmod>${lm}</lastmod>`);
      if (e.changeFrequency) parts.push(`<changefreq>${e.changeFrequency}</changefreq>`);
      if (typeof e.priority === "number") parts.push(`<priority>${Math.min(1, Math.max(0, e.priority)).toFixed(1)}</priority>`);
      return `  <url>${parts.join("")}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** `MetadataRoute.Robots` → robots.txt text. */
export function robotsTxt(r: MetadataRoute.Robots): string {
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  const list = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const lines: string[] = [];
  for (const rule of rules) {
    for (const ua of list(rule.userAgent).length ? list(rule.userAgent) : ["*"]) lines.push(`User-agent: ${ua}`);
    for (const a of list(rule.allow)) lines.push(`Allow: ${a}`);
    for (const d of list(rule.disallow)) lines.push(`Disallow: ${d}`);
    if (rule.crawlDelay != null) lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    lines.push("");
  }
  if (r.host) lines.push(`Host: ${r.host}`);
  for (const s of list(r.sitemap)) lines.push(`Sitemap: ${s}`);
  return `${lines.join("\n").trim()}\n`;
}

/* ───────────────────────── manifest ───────────────────────── */

/** Web app manifest for a tenant host: the tenant's name, colours and icon so "Add to home screen" looks like their brand. */
export function buildTenantManifest(tc: TenantContext, lang: Lang = "en"): MetadataRoute.Manifest {
  const meta = getTemplateMeta(tc.tenant.templateId);
  const primary = themePrimary(meta?.theme, tc.settings.branding);
  const bg = safeHex(meta?.theme.colors.bg) ?? "#ffffff";
  const icon = safeImageSrc(tc.settings.branding.faviconUrl);
  const name = tc.tenant.name.trim() || brand.name;
  return {
    name,
    short_name: truncate(name, 12).replace(/\.\.\.$/, ""),
    description: describeTenant(tc, lang),
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: bg,
    theme_color: primary,
    lang: lang === "ur" ? "ur" : "en",
    dir: lang === "ur" ? "rtl" : "ltr",
    icons: icon ? [{ src: icon, sizes: "any", purpose: "any" }] : [],
  };
}

/* ───────────────────────── metadata ───────────────────────── */

function categoryName(tc: TenantContext, lang: Lang): string {
  return lang === "ur" ? tc.category.nameUr : tc.category.name;
}

/** Default meta description when the tenant has not written one. */
export function describeTenant(tc: TenantContext, lang: Lang): string {
  const custom = tc.settings.seo.description?.trim();
  if (custom) return truncate(custom, 300);
  const city = tc.settings.contact.city.trim();
  const name = tc.tenant.name;
  const cat = categoryName(tc, lang);
  if (lang === "ur") return city ? `${name} — ${city} میں ${cat}۔ رابطہ، اوقات کار اور تفصیلات۔` : `${name} — ${cat}، پاکستان۔`;
  return city ? `${name} — ${cat} in ${city}, Pakistan. Contact details, opening hours and more.` : `${name} — ${cat} in Pakistan.`;
}

/** Default document title (used when a page sets none). */
export function defaultTitle(tc: TenantContext, lang: Lang): string {
  const custom = tc.settings.seo.title?.trim();
  if (custom) return truncate(custom, 120);
  const city = tc.settings.contact.city.trim();
  const cat = categoryName(tc, lang);
  return city ? `${tc.tenant.name} — ${cat}, ${city}` : `${tc.tenant.name} — ${cat}`;
}

/** Absolute, validated share image for a tenant (Settings › SEO first, then the given fallback e.g. hero image). */
export function tenantOgImage(tc: TenantContext, fallback?: string | null, host: string = tc.host): string | null {
  for (const candidate of [tc.settings.seo.ogImageUrl, fallback]) {
    const safe = safeImageSrc(candidate);
    if (!safe || safe.startsWith("data:") || safe.startsWith("blob:")) continue;
    return safe.startsWith("/") ? tenantUrl(tc, safe, host) : safe;
  }
  return null;
}

const GOOGLEBOT = { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } as const;

/**
 * Base metadata for every page on a tenant host (set in the tenant root layout). Pages add `title`,
 * `description`, `alternates.canonical` and OG images; `metadataBase` makes relative values absolute.
 * DRAFT / SUSPENDED / demo tenants are `noindex`.
 */
export function tenantMetadata(tc: TenantContext, lang: Lang, host: string = tc.host): Metadata {
  const origin = tenantOrigin(tc, host);
  const name = tc.tenant.name;
  const title = defaultTitle(tc, lang);
  const description = describeTenant(tc, lang);
  const image = tenantOgImage(tc, null, host);
  const icon = safeImageSrc(tc.settings.branding.faviconUrl);
  const indexable = tenantIsIndexable(tc);
  const urdu = tc.settings.languages.urduEnabled;
  return {
    metadataBase: new URL(origin),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    generator: brand.name,
    manifest: "/manifest.webmanifest",
    icons: icon ? { icon: [{ url: icon }], apple: [{ url: icon }] } : undefined,
    formatDetection: { telephone: true, email: true, address: false },
    openGraph: {
      type: "website",
      siteName: name,
      locale: ogLocale(lang),
      alternateLocale: urdu ? [ogLocale(otherLang(lang))] : undefined,
      title,
      description,
      url: "/",
      images: image ? [{ url: image, width: 1200, height: 630, alt: name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [{ url: image, alt: name }] : undefined,
    },
    robots: indexable ? { index: true, follow: true, googleBot: GOOGLEBOT } : { index: false, follow: false, noarchive: true, googleBot: { index: false, follow: false } },
  };
}

/** Viewport for tenant pages: brand colour for the browser chrome, light colour scheme (templates are light-first). */
export function tenantViewport(tc: TenantContext): Viewport {
  const meta = getTemplateMeta(tc.tenant.templateId);
  return {
    width: "device-width",
    initialScale: 1,
    themeColor: themePrimary(meta?.theme, tc.settings.branding),
    colorScheme: "light",
  };
}

/* ───────────────────────── schema.org JSON-LD ───────────────────────── */

export type JsonLdObject = Record<string, unknown>;

/** schema.org LocalBusiness subtype per business category. */
export const BUSINESS_TYPE: Record<CategoryKey, string> = {
  kitchen: "HomeGoodsStore",
  printing: "LocalBusiness",
  clothing: "ClothingStore",
  shoes: "ShoeStore",
  gifts: "Store",
  blades: "Store",
  recruiting: "EmploymentAgency",
  travel: "TravelAgency",
  pizza: "Restaurant",
  sports: "SportingGoodsStore",
  gym: "ExerciseGym",
  bakery: "Bakery",
  law: "LegalService",
  electronics: "ElectronicsStore",
  medical: "Pharmacy",
  realestate: "RealEstateAgent",
};

const DAY_URIS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => `https://schema.org/${d}`);
const HHMM_RE = /^([01]?\d|2[0-4]):[0-5]\d$/;

function openingHours(tc: TenantContext): JsonLdObject[] {
  const out: JsonLdObject[] = [];
  for (const h of tc.settings.hours) {
    if (h.closed || !HHMM_RE.test(h.open) || !HHMM_RE.test(h.close)) continue;
    const day = DAY_URIS[h.day];
    if (!day) continue;
    out.push({ "@type": "OpeningHoursSpecification", dayOfWeek: day, opens: h.open.padStart(5, "0"), closes: h.close.padStart(5, "0") });
  }
  return out;
}

function safeEmail(v: string | undefined): string | undefined {
  const e = (v ?? "").trim();
  return e && e.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e) ? e : undefined;
}

function compact(o: JsonLdObject): JsonLdObject {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)));
}

export function businessId(tc: TenantContext, host: string = tc.host): string {
  return `${tenantOrigin(tc, host)}/#business`;
}

/**
 * LocalBusiness (category subtype) for the tenant. Only validated values are emitted: PK-normalised phone,
 * syntactically valid e-mail, http(s) social links, absolute image URLs.
 */
export function localBusinessJsonLd(tc: TenantContext, opts: { lang?: Lang; host?: string; logo?: string | null; image?: string | null } = {}): JsonLdObject {
  const lang = opts.lang ?? "en";
  const host = opts.host ?? tc.host;
  const origin = tenantOrigin(tc, host);
  const c = tc.settings.contact;
  const phone = normalizePkPhone(c.phone) ?? undefined;
  const logo = tenantOgImage({ ...tc, settings: { ...tc.settings, seo: { ...tc.settings.seo, ogImageUrl: undefined } } }, opts.logo ?? tc.settings.branding.logoUrl, host);
  const image = tenantOgImage(tc, opts.image, host) ?? logo;
  const sameAs = Object.values(tc.settings.social)
    .map((u) => safeExternalUrl(u))
    .filter((u): u is string => Boolean(u));
  const street = c.address.trim();
  const city = c.city.trim();
  const address = street || city ? compact({ "@type": "PostalAddress", streetAddress: street || undefined, addressLocality: city || undefined, addressCountry: "PK" }) : undefined;
  const sells = hasModule(tc, "ecommerce") || hasModule(tc, "restaurant");
  return compact({
    "@context": "https://schema.org",
    "@type": BUSINESS_TYPE[tc.category.key] ?? "LocalBusiness",
    "@id": businessId(tc, host),
    name: tc.tenant.name,
    url: origin,
    description: describeTenant(tc, lang),
    image: image ? [image] : undefined,
    logo: logo ?? undefined,
    telephone: phone,
    email: safeEmail(c.email),
    address,
    areaServed: { "@type": "Country", name: "Pakistan" },
    openingHoursSpecification: openingHours(tc),
    sameAs,
    currenciesAccepted: sells ? "PKR" : undefined,
    paymentAccepted: sells && tc.settings.commerce.codEnabled ? "Cash on Delivery" : undefined,
    ...(tc.category.key === "pizza" ? { servesCuisine: "Pizza" } : {}),
  });
}

/** WebSite node linking to the business (enables sitelinks / knowledge panel association). */
export function webSiteJsonLd(tc: TenantContext, host: string = tc.host): JsonLdObject {
  const origin = tenantOrigin(tc, host);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: tc.tenant.name,
    inLanguage: tc.settings.languages.urduEnabled ? ["en", "ur"] : ["en"],
    publisher: { "@id": businessId(tc, host) },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(tc: TenantContext, items: BreadcrumbItem[], host: string = tc.host): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: tenantUrl(tc, it.path, host) })),
  };
}

/** Serialise JSON-LD for an inline `<script type="application/ld+json">`; `<` is escaped so content can never close the tag. */
export function jsonLdString(data: JsonLdObject | JsonLdObject[]): string {
  const payload = Array.isArray(data) && data.length === 1 ? data[0] : data;
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}
