import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/server/tenant";
import { buildTenantSitemap, sitemapXml } from "@/server/site-seo";
import { log, errorFields } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * `/sitemap.xml` on a tenant host (proxy.ts rewrites it to `/_sites/<host>/sitemap.xml`).
 * Demo / DRAFT / SUSPENDED tenants get an empty urlset; unknown hosts 404.
 */
export async function GET() {
  try {
    const tc = await getCurrentTenant();
    if (!tc) return new NextResponse("Not found", { status: 404, headers: { "cache-control": "no-store" } });
    const xml = sitemapXml(await buildTenantSitemap(tc));
    return new NextResponse(xml, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "x-robots-tag": "noindex",
      },
    });
  } catch (err) {
    log.error("tenant sitemap failed", errorFields(err));
    return new NextResponse("Service unavailable", { status: 503, headers: { "cache-control": "no-store", "retry-after": "60" } });
  }
}
