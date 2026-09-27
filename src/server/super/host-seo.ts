import "server-only";
import { headers } from "next/headers";
import type { MetadataRoute } from "next";
import { hostUrl, isPlatformHost } from "@/config/site";
import { getTenantByHost, type TenantContext } from "@/server/tenant";

/**
 * Host resolution for the root-level metadata routes (`app/sitemap.ts`, `app/robots.ts`,
 * `app/manifest.ts`). Those files are matched before any host rewrite can be applied to them, so
 * they may be requested on the platform host, a Vercel preview host, or a tenant host. The
 * platform answers for itself; tenant hosts get a tenant-specific answer.
 *
 * HANDOFF (tenant-site stream): `src/server/site-seo.ts` with `buildTenantSitemap(tc)` /
 * `buildTenantRobots(tc)` was not present when this was written. The two `tenant*Fallback`
 * functions below are the minimal stand-ins; swap the calls in sitemap.ts / robots.ts for the
 * real builders once they exist and delete the fallbacks.
 */

export type SeoHost = { kind: "platform"; host: string } | { kind: "tenant"; host: string; tc: TenantContext } | { kind: "unknown"; host: string };

/** Host of the current request as set by proxy.ts (falls back to the raw Host header). */
export async function requestHost(): Promise<string> {
  const h = await headers();
  return (h.get("x-request-host") ?? h.get("x-tenant-host") ?? h.get("host") ?? "").split(":")[0].toLowerCase();
}

export async function resolveSeoHost(): Promise<SeoHost> {
  const host = await requestHost();
  if (!host || isPlatformHost(host)) return { kind: "platform", host };
  const tc = await getTenantByHost(host).catch(() => null);
  return tc ? { kind: "tenant", host, tc } : { kind: "unknown", host };
}

/** A tenant may be crawled only when it is live and not a demo. */
export function tenantIsIndexable(tc: TenantContext): boolean {
  return tc.tenant.status === "ACTIVE" && !tc.tenant.isDemo;
}

/** Public paths that exist for a tenant, derived from its category modules. */
export function tenantPublicPaths(tc: TenantContext): string[] {
  const has = (m: string) => tc.category.modules.includes(m as (typeof tc.category.modules)[number]);
  const paths = ["/", "/contact"];
  if (has("ecommerce")) paths.push("/shop");
  if (has("restaurant")) paths.push("/menu", "/reserve");
  if (has("recruiting")) paths.push("/jobs", "/employers");
  if (has("travel")) paths.push("/packages");
  if (has("realestate")) paths.push("/properties");
  if (has("gym")) paths.push("/plans", "/classes", "/join");
  if (has("law")) paths.push("/consultation");
  if (has("printing")) paths.push("/quote");
  if (has("medical")) paths.push("/upload-prescription");
  if (has("services")) paths.push("/services");
  if (has("team")) paths.push("/team");
  if (has("gallery")) paths.push("/gallery");
  if (has("faq")) paths.push("/faq");
  if (has("posts")) paths.push("/blog");
  return paths;
}

export function tenantSitemapFallback(tc: TenantContext, host: string): MetadataRoute.Sitemap {
  if (!tenantIsIndexable(tc)) return [];
  const lastModified = tc.tenant.updatedAt;
  return tenantPublicPaths(tc).map((path) => ({
    url: hostUrl(host, path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

export function tenantRobotsFallback(tc: TenantContext, host: string): MetadataRoute.Robots {
  if (!tenantIsIndexable(tc)) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/cart", "/checkout", "/order/", "/menu/checkout", "/menu/order/"],
    },
    sitemap: hostUrl(host, "/sitemap.xml"),
  };
}
