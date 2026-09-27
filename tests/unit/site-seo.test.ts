import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORY_MAP, type CategoryKey } from "@/lib/categories";
import { parseSettings } from "@/lib/tenant-settings";
import { setLogSink } from "@/lib/log";
import type { TenantContext } from "@/server/tenant";

/**
 * Per-tenant SEO builders (src/server/site-seo.ts): sitemap / robots / manifest / metadata / JSON-LD.
 * Prisma is replaced by an in-memory `findMany` per collection — no database. Every value that reaches
 * a URL, `<meta>` or JSON-LD must be validated, so the negative cases (bad slugs, javascript: links,
 * malformed phone/email, DB failure) matter as much as the happy path.
 */

const rows = vi.hoisted(() => ({
  sitePage: [] as Array<{ slug: string; updatedAt?: Date | null }>,
  tenantPost: [] as Array<{ slug: string; updatedAt?: Date | null }>,
  product: [] as Array<{ slug: string; updatedAt?: Date | null }>,
  productCategory: [] as Array<{ slug: string }>,
  job: [] as Array<{ slug: string; updatedAt?: Date | null }>,
  travelPackage: [] as Array<{ slug: string; updatedAt?: Date | null }>,
  property: [] as Array<{ slug: string; updatedAt?: Date | null }>,
  service: [] as Array<{ slug: string }>,
  teamMember: [] as Array<{ slug: string }>,
  fail: false,
  calls: [] as string[],
}));

vi.mock("@/server/db", () => {
  const table = (name: keyof typeof rows) => ({
    findMany: vi.fn(async () => {
      rows.calls.push(name);
      if (rows.fail) throw new Error("connection refused");
      return rows[name];
    }),
  });
  return {
    db: {
      sitePage: table("sitePage"),
      tenantPost: table("tenantPost"),
      product: table("product"),
      productCategory: table("productCategory"),
      job: table("job"),
      travelPackage: table("travelPackage"),
      property: table("property"),
      service: table("service"),
      teamMember: table("teamMember"),
    },
  };
});

const seo = await import("@/server/site-seo");

const logged: string[] = [];
const prevSink = setLogSink((_level, line) => {
  logged.push(line);
});
afterAll(() => setLogSink(prevSink));

const UPDATED = new Date("2026-09-01T10:00:00.000Z");

function ctx(
  overrides: {
    category?: CategoryKey;
    status?: "DRAFT" | "ACTIVE" | "SUSPENDED";
    isDemo?: boolean;
    host?: string;
    settings?: Parameters<typeof parseSettings>[0];
    name?: string;
  } = {},
): TenantContext {
  const category = CATEGORY_MAP[overrides.category ?? "pizza"];
  return {
    tenant: {
      id: "t_1",
      slug: "karachi-pizza",
      name: overrides.name ?? "Karachi Pizza Co.",
      category: category.key,
      templateId: `${category.key}-01`,
      status: overrides.status ?? "ACTIVE",
      isDemo: overrides.isDemo ?? false,
      updatedAt: UPDATED,
    } as unknown as TenantContext["tenant"],
    settings: parseSettings(overrides.settings ?? {}),
    category,
    host: overrides.host ?? "karachipizza.pk",
  };
}

beforeEach(() => {
  for (const k of Object.keys(rows) as Array<keyof typeof rows>) {
    if (Array.isArray(rows[k])) (rows[k] as unknown[]).length = 0;
  }
  rows.fail = false;
  logged.length = 0;
});

describe("tenantIsIndexable / tenantOrigin / tenantUrl", () => {
  it("only live, non-demo tenants are indexable", () => {
    expect(seo.tenantIsIndexable(ctx())).toBe(true);
    expect(seo.tenantIsIndexable(ctx({ status: "DRAFT" }))).toBe(false);
    expect(seo.tenantIsIndexable(ctx({ status: "SUSPENDED" }))).toBe(false);
    expect(seo.tenantIsIndexable(ctx({ isDemo: true }))).toBe(false);
  });

  it("builds https origins for real hosts and http://…:3000 for localhost tenants", () => {
    expect(seo.tenantOrigin(ctx())).toBe("https://karachipizza.pk");
    expect(seo.tenantOrigin(ctx(), "www.karachipizza.pk")).toBe("https://www.karachipizza.pk");
    expect(seo.tenantOrigin(ctx({ host: "demo-pizza-01.localhost" }))).toBe("http://demo-pizza-01.localhost:3000");
    expect(seo.tenantUrl(ctx(), "shop")).toBe("https://karachipizza.pk/shop");
    expect(seo.tenantUrl(ctx(), "/menu/x")).toBe("https://karachipizza.pk/menu/x");
  });
});

describe("tenantPublicPaths", () => {
  it("always starts with / and /contact and follows the category modules", () => {
    const pizza = seo.tenantPublicPaths(ctx({ category: "pizza" }));
    expect(pizza.slice(0, 2)).toEqual(["/", "/contact"]);
    expect(pizza).toContain("/menu");
    expect(pizza).not.toContain("/shop");
    expect(pizza).not.toContain("/reserve");
    expect(pizza).not.toContain("/jobs");

    const shop = seo.tenantPublicPaths(ctx({ category: "clothing" }));
    expect(shop).toContain("/shop");
    expect(shop).not.toContain("/menu");

    const jobs = seo.tenantPublicPaths(ctx({ category: "recruiting" }));
    expect(jobs).toEqual(expect.arrayContaining(["/jobs", "/employers", "/services", "/team"]));
  });

  it("adds /reserve only when the restaurant has reservations switched on", () => {
    expect(seo.tenantPublicPaths(ctx({ category: "pizza", settings: { restaurant: { reservations: true } } }))).toContain("/reserve");
    expect(seo.tenantPublicPaths(ctx({ category: "clothing", settings: { restaurant: { reservations: true } } }))).not.toContain("/reserve");
  });

  it("has no duplicates", () => {
    for (const key of Object.keys(CATEGORY_MAP) as CategoryKey[]) {
      const paths = seo.tenantPublicPaths(ctx({ category: key }));
      expect(new Set(paths).size, key).toBe(paths.length);
    }
  });
});

describe("buildTenantSitemap", () => {
  it("is empty for draft / demo tenants and never touches the database", async () => {
    expect(await seo.buildTenantSitemap(ctx({ status: "DRAFT" }))).toEqual([]);
    expect(await seo.buildTenantSitemap(ctx({ isDemo: true }))).toEqual([]);
    expect(rows.calls).toEqual([]);
  });

  it("lists static paths first with the tenant updatedAt, then detail pages with their own dates", async () => {
    rows.sitePage.push({ slug: "about", updatedAt: new Date("2026-09-10T00:00:00Z") });
    rows.tenantPost.push({ slug: "opening-week", updatedAt: null });
    const map = await seo.buildTenantSitemap(ctx({ category: "pizza" }));
    const urls = map.map((e) => e.url);
    expect(urls[0]).toBe("https://karachipizza.pk/");
    expect(map[0]).toMatchObject({ priority: 1, changeFrequency: "weekly", lastModified: UPDATED });
    expect(urls).toContain("https://karachipizza.pk/menu");
    expect(urls).toContain("https://karachipizza.pk/p/about");
    expect(urls).toContain("https://karachipizza.pk/blog/opening-week");
    expect(map.find((e) => e.url.endsWith("/p/about"))?.lastModified).toEqual(new Date("2026-09-10T00:00:00Z"));
    expect(map.find((e) => e.url.endsWith("/blog/opening-week"))?.lastModified).toEqual(UPDATED);
  });

  it("only queries collections the category actually has", async () => {
    await seo.buildTenantSitemap(ctx({ category: "pizza" }));
    expect(rows.calls).toContain("sitePage");
    expect(rows.calls).toContain("tenantPost");
    expect(rows.calls).not.toContain("product");
    expect(rows.calls).not.toContain("job");
    rows.calls.length = 0;
    await seo.buildTenantSitemap(ctx({ category: "clothing" }));
    expect(rows.calls).toEqual(expect.arrayContaining(["product", "productCategory"]));
    expect(rows.calls).not.toContain("travelPackage");
  });

  it("drops slugs that could break out of the path and encodes the rest", async () => {
    rows.product.push({ slug: "lawn-3pc" }, { slug: "../admin" }, { slug: "a b" }, { slug: "" }, { slug: "x".repeat(200) });
    const map = await seo.buildTenantSitemap(ctx({ category: "clothing" }));
    const shop = map.filter((e) => e.url.includes("/shop/")).map((e) => e.url);
    expect(shop).toEqual(["https://karachipizza.pk/shop/lawn-3pc"]);
  });

  it("degrades to the static entries (and logs a warning) when the database fails", async () => {
    rows.fail = true;
    const tc = ctx({ category: "pizza" });
    const map = await seo.buildTenantSitemap(tc);
    expect(map.map((e) => e.url)).toEqual(seo.tenantPublicPaths(tc).map((p) => seo.tenantUrl(tc, p)));
    expect(logged.some((l) => l.includes("sitemap detail queries failed"))).toBe(true);
    expect(logged.join("\n")).not.toContain("postgres");
  });

  it("uses the requested host when the sitemap is served from an alias", async () => {
    const map = await seo.buildTenantSitemap(ctx(), "www.karachipizza.pk");
    expect(map.every((e) => e.url.startsWith("https://www.karachipizza.pk/"))).toBe(true);
  });
});

describe("buildTenantRobots / robotsTxt", () => {
  it("blocks everything for non-indexable tenants", () => {
    const r = seo.buildTenantRobots(ctx({ status: "DRAFT" }));
    expect(r).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(seo.robotsTxt(r)).toBe("User-agent: *\nDisallow: /\n");
  });

  it("allows live tenants but hides transactional and internal paths and points at the sitemap", () => {
    const r = seo.buildTenantRobots(ctx());
    const txt = seo.robotsTxt(r);
    expect(txt).toMatch(/^User-agent: \*\nAllow: \/\n/);
    for (const p of ["/admin", "/api/", "/cart", "/checkout", "/_sites/", "/_next/"]) expect(txt).toContain(`Disallow: ${p}\n`);
    expect(txt.trimEnd().split("\n").at(-1)).toBe("Sitemap: https://karachipizza.pk/sitemap.xml");
  });

  it("serialises multiple rules, crawl delay and host", () => {
    const txt = seo.robotsTxt({
      rules: [
        { userAgent: ["Googlebot", "Bingbot"], allow: "/", crawlDelay: 5 },
        { userAgent: "BadBot", disallow: "/" },
      ],
      host: "karachipizza.pk",
      sitemap: ["https://karachipizza.pk/sitemap.xml"],
    });
    expect(txt).toBe(
      ["User-agent: Googlebot", "User-agent: Bingbot", "Allow: /", "Crawl-delay: 5", "", "User-agent: BadBot", "Disallow: /", "", "Host: karachipizza.pk", "Sitemap: https://karachipizza.pk/sitemap.xml", ""].join("\n"),
    );
  });
});

describe("sitemapXml", () => {
  it("emits a valid urlset with escaped locs, ISO dates and clamped priorities", () => {
    const xml = seo.sitemapXml([
      { url: "https://karachipizza.pk/shop?a=1&b=<x>", lastModified: new Date("2026-09-01T10:00:00.000Z"), changeFrequency: "weekly", priority: 1.7 },
      { url: "https://karachipizza.pk/x", lastModified: "not-a-date", priority: -1 },
      { url: "https://karachipizza.pk/y" },
    ]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')).toBe(true);
    expect(xml).toContain("<loc>https://karachipizza.pk/shop?a=1&amp;b=&lt;x&gt;</loc>");
    expect(xml).toContain("<lastmod>2026-09-01T10:00:00.000Z</lastmod>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).toContain("<priority>0.0</priority>");
    expect(xml).not.toContain("not-a-date");
    expect(xml.match(/<url>/g)).toHaveLength(3);
    expect(xml.endsWith("</urlset>\n")).toBe(true);
  });

  it("handles an empty sitemap", () => {
    expect(seo.sitemapXml([])).toContain("<urlset");
    expect(seo.sitemapXml([])).not.toContain("<url>");
  });
});

describe("buildTenantManifest", () => {
  it("uses the tenant name, template colours and a validated icon; Urdu switches lang/dir", () => {
    const m = seo.buildTenantManifest(ctx({ settings: { branding: { faviconUrl: "https://media.siteforge.pk/t_1/icon.png" } } }));
    expect(m.name).toBe("Karachi Pizza Co.");
    expect(m.short_name?.length).toBeLessThanOrEqual(12);
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(m.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(m.icons).toEqual([{ src: "https://media.siteforge.pk/t_1/icon.png", sizes: "any", purpose: "any" }]);
    expect(m.lang).toBe("en");
    expect(m.dir).toBe("ltr");

    const ur = seo.buildTenantManifest(ctx(), "ur");
    expect(ur.lang).toBe("ur");
    expect(ur.dir).toBe("rtl");
  });

  it("drops an unsafe favicon URL instead of shipping it", () => {
    const m = seo.buildTenantManifest(ctx({ settings: { branding: { faviconUrl: "javascript:alert(1)" } } }));
    expect(m.icons).toEqual([]);
  });
});

describe("describeTenant / defaultTitle / tenantMetadata", () => {
  it("prefers the tenant's own SEO text, else builds one from category + city (EN and UR)", () => {
    const withCity = ctx({ settings: { contact: { city: "Karachi" } } });
    expect(seo.describeTenant(withCity, "en")).toBe("Karachi Pizza Co. — Pizza Shop in Karachi, Pakistan. Contact details, opening hours and more.");
    expect(seo.describeTenant(withCity, "ur")).toContain("پیزا شاپ");
    expect(seo.describeTenant(ctx(), "en")).toBe("Karachi Pizza Co. — Pizza Shop in Pakistan.");
    expect(seo.defaultTitle(withCity, "en")).toBe("Karachi Pizza Co. — Pizza Shop, Karachi");
    expect(seo.defaultTitle(ctx(), "en")).toBe("Karachi Pizza Co. — Pizza Shop");

    const custom = ctx({ settings: { seo: { title: "  Best pizza in town  ", description: "x".repeat(400) } } });
    expect(seo.defaultTitle(custom, "en")).toBe("Best pizza in town");
    const desc = seo.describeTenant(custom, "en");
    expect(desc.endsWith("...")).toBe(true);
    expect(desc.length).toBe(302); // truncate(s, 300) keeps 299 chars + ellipsis
  });

  it("base metadata: metadataBase on the tenant origin, title template, indexable → index, draft → noindex", () => {
    const live = seo.tenantMetadata(ctx(), "en");
    expect(String(live.metadataBase)).toBe("https://karachipizza.pk/");
    expect(live.title).toEqual({ default: "Karachi Pizza Co. — Pizza Shop", template: "%s | Karachi Pizza Co." });
    expect(live.manifest).toBe("/manifest.webmanifest");
    expect(live.robots).toMatchObject({ index: true, follow: true });
    expect(live.openGraph).toMatchObject({ type: "website", locale: "en_PK", siteName: "Karachi Pizza Co." });
    expect((live.openGraph as { alternateLocale?: unknown }).alternateLocale).toBeUndefined();
    expect(live.twitter).toMatchObject({ card: "summary" });

    const draft = seo.tenantMetadata(ctx({ status: "DRAFT" }), "en");
    expect(draft.robots).toMatchObject({ index: false, follow: false, noarchive: true });
  });

  it("advertises the Urdu alternate only when the tenant enabled it and picks up a validated OG image", () => {
    const tc = ctx({ settings: { languages: { urduEnabled: true }, seo: { ogImageUrl: "/og.png" } } });
    const md = seo.tenantMetadata(tc, "en");
    expect((md.openGraph as { alternateLocale?: string[] }).alternateLocale).toEqual(["ur_PK"]);
    expect((md.openGraph as { images?: Array<{ url: string }> }).images?.[0].url).toBe("https://karachipizza.pk/og.png");
    expect(md.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("tenantOgImage refuses data:/javascript: candidates and falls back in order", () => {
    expect(seo.tenantOgImage(ctx({ settings: { seo: { ogImageUrl: "javascript:alert(1)" } } }), "https://cdn.example/hero.jpg")).toBe("https://cdn.example/hero.jpg");
    expect(seo.tenantOgImage(ctx({ settings: { seo: { ogImageUrl: "data:image/png;base64,AAAA" } } }), null)).toBeNull();
    expect(seo.tenantOgImage(ctx(), "/uploads/hero.jpg")).toBe("https://karachipizza.pk/uploads/hero.jpg");
  });
});

describe("tenantPageMetadata", () => {
  it("builds complete OG/Twitter objects with a canonical path and the title suffix", () => {
    const md = seo.tenantPageMetadata(ctx(), "en", { title: "Lawn 3pc", description: "Nice", path: "shop/lawn-3pc", image: "https://cdn.example/p.jpg" });
    expect(md.title).toBe("Lawn 3pc");
    expect(md.alternates).toEqual({ canonical: "/shop/lawn-3pc" });
    expect(md.openGraph).toMatchObject({ url: "/shop/lawn-3pc", title: "Lawn 3pc | Karachi Pizza Co.", description: "Nice", type: "website" });
    expect((md.openGraph as { images?: Array<{ url: string }> }).images?.[0].url).toBe("https://cdn.example/p.jpg");
    expect(md.robots).toBeUndefined();
  });

  it("absoluteTitle skips the suffix; article type carries the dates; noIndex adds robots", () => {
    const md = seo.tenantPageMetadata(ctx(), "en", { title: "Standalone", absoluteTitle: true, path: "/blog/x", type: "article", publishedTime: "2026-09-01", modifiedTime: "2026-09-02", noIndex: true });
    expect(md.title).toEqual({ absolute: "Standalone" });
    expect(md.openGraph).toMatchObject({ type: "article", title: "Standalone", publishedTime: "2026-09-01", modifiedTime: "2026-09-02" });
    expect(md.robots).toMatchObject({ index: false, follow: false });
  });

  it("falls back to the tenant defaults when a page gives no title/description", () => {
    const md = seo.tenantPageMetadata(ctx(), "en", { path: "/contact" });
    expect(md.title).toBeUndefined();
    expect(md.description).toBe("Karachi Pizza Co. — Pizza Shop in Pakistan.");
    expect(md.openGraph).toMatchObject({ title: "Karachi Pizza Co. — Pizza Shop" });
  });
});

describe("JSON-LD", () => {
  it("localBusinessJsonLd emits only validated contact data and the category subtype", () => {
    const tc = ctx({
      category: "pizza",
      settings: {
        contact: { phone: "0300 1234567", email: " owner@karachipizza.pk ", address: "Shop 4, Tariq Road", city: "Karachi" },
        social: { facebook: "https://facebook.com/karachipizza", instagram: "not a url" },
        hours: [
          { day: 1, open: "9:00", close: "23:00", closed: false },
          { day: 2, open: "09:00", close: "23:00", closed: true },
          { day: 3, open: "25:00", close: "23:00", closed: false },
        ],
        branding: { logoUrl: "/logo.png" },
      },
    });
    const ld = seo.localBusinessJsonLd(tc);
    expect(ld["@type"]).toBe("Restaurant");
    expect(ld["@id"]).toBe("https://karachipizza.pk/#business");
    expect(ld.url).toBe("https://karachipizza.pk");
    expect(ld.telephone).toBe("+923001234567");
    expect(ld.email).toBe("owner@karachipizza.pk");
    expect(ld.address).toEqual({ "@type": "PostalAddress", streetAddress: "Shop 4, Tariq Road", addressLocality: "Karachi", addressCountry: "PK" });
    expect(ld.sameAs).toEqual(["https://facebook.com/karachipizza"]);
    expect(ld.openingHoursSpecification).toEqual([{ "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Monday", opens: "09:00", closes: "23:00" }]);
    expect(ld.logo).toBe("https://karachipizza.pk/logo.png");
    expect(ld.image).toEqual(["https://karachipizza.pk/logo.png"]);
    expect(ld.currenciesAccepted).toBe("PKR");
    expect(ld.paymentAccepted).toBe("Cash on Delivery");
    expect(ld.servesCuisine).toBe("Pizza");
  });

  it("omits empty / invalid fields instead of emitting nulls, and non-selling categories carry no payment info", () => {
    const ld = seo.localBusinessJsonLd(ctx({ category: "law", settings: { contact: { phone: "12", email: "nope" } } }));
    expect(ld["@type"]).toBe("LegalService");
    for (const k of ["telephone", "email", "address", "logo", "image", "currenciesAccepted", "paymentAccepted", "servesCuisine"]) expect(ld, k).not.toHaveProperty(k);
    expect(ld).not.toHaveProperty("sameAs");
    expect(ld).not.toHaveProperty("openingHoursSpecification");
    expect(Object.values(ld)).not.toContain(null);
    expect(Object.values(ld)).not.toContain(undefined);
  });

  it("webSiteJsonLd links back to the business and lists the enabled languages", () => {
    expect(seo.webSiteJsonLd(ctx())).toMatchObject({ "@type": "WebSite", "@id": "https://karachipizza.pk/#website", inLanguage: ["en"], publisher: { "@id": "https://karachipizza.pk/#business" } });
    expect(seo.webSiteJsonLd(ctx({ settings: { languages: { urduEnabled: true } } })).inLanguage).toEqual(["en", "ur"]);
  });

  it("breadcrumbJsonLd numbers items from 1 with absolute URLs", () => {
    const ld = seo.breadcrumbJsonLd(ctx(), [
      { name: "Home", path: "/" },
      { name: "Menu", path: "/menu" },
    ]);
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://karachipizza.pk/" },
      { "@type": "ListItem", position: 2, name: "Menu", item: "https://karachipizza.pk/menu" },
    ]);
  });

  it("jsonLdString escapes < so content can never close the script tag, and unwraps a single-item array", () => {
    const s = seo.jsonLdString({ name: "</script><script>alert(1)</script>" });
    expect(s).not.toContain("</script>");
    expect(s).toContain("\\u003c/script>");
    expect(JSON.parse(s).name).toBe("</script><script>alert(1)</script>");
    expect(seo.jsonLdString([{ a: 1 }])).toBe('{"a":1}');
    expect(seo.jsonLdString([{ a: 1 }, { b: 2 }])).toBe('[{"a":1},{"b":2}]');
  });

  it("BUSINESS_TYPE covers every category", () => {
    for (const key of Object.keys(CATEGORY_MAP) as CategoryKey[]) expect(seo.BUSINESS_TYPE[key], key).toBeTruthy();
  });
});
