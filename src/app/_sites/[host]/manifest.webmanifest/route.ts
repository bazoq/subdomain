import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/server/tenant";
import { currentLang } from "@/server/site";
import { buildTenantManifest } from "@/server/site-seo";
import { log, errorFields } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * `/manifest.webmanifest` on a tenant host (proxy.ts rewrites it to `/_sites/<host>/manifest.webmanifest`).
 * Referenced from the tenant root layout metadata (`manifest: "/manifest.webmanifest"`).
 */
export async function GET() {
  try {
    const tc = await getCurrentTenant();
    if (!tc) return new NextResponse("Not found", { status: 404, headers: { "cache-control": "no-store" } });
    const lang = tc.settings.languages.urduEnabled ? await currentLang() : "en";
    return NextResponse.json(buildTenantManifest(tc, lang), {
      headers: {
        "content-type": "application/manifest+json; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    log.error("tenant manifest failed", errorFields(err));
    return new NextResponse("Service unavailable", { status: 503, headers: { "cache-control": "no-store", "retry-after": "60" } });
  }
}
