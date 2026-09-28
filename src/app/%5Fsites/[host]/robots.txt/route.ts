import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/server/tenant";
import { buildTenantRobots, robotsTxt } from "@/server/site-seo";
import { log, errorFields } from "@/lib/log";

export const dynamic = "force-dynamic";

const DISALLOW_ALL = "User-agent: *\nDisallow: /\n";

/**
 * `/robots.txt` on a tenant host (proxy.ts rewrites it to `/_sites/<host>/robots.txt`).
 * Unknown hosts and any failure answer "disallow everything" — the safe default for a crawler.
 */
export async function GET() {
  const headers = { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" };
  try {
    const tc = await getCurrentTenant();
    if (!tc) return new NextResponse(DISALLOW_ALL, { status: 404, headers: { ...headers, "cache-control": "no-store" } });
    return new NextResponse(robotsTxt(buildTenantRobots(tc)), { headers });
  } catch (err) {
    log.error("tenant robots failed", errorFields(err));
    return new NextResponse(DISALLOW_ALL, { status: 503, headers: { ...headers, "cache-control": "no-store", "retry-after": "60" } });
  }
}
