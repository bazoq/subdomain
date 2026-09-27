import "server-only";
import { headers } from "next/headers";
import { isPlatformHost } from "@/config/site";
import { getTenantByHost, type TenantContext } from "@/server/tenant";

/**
 * Host resolution for the root-level metadata routes (`app/sitemap.ts`, `app/robots.ts`,
 * `app/manifest.ts`). `src/proxy.ts` rewrites tenant-host requests for these paths to
 * `/_sites/<host>/…` (served by the tenant-site route handlers), so in practice these files answer on
 * the platform host and Vercel preview hosts only. Resolving the host anyway keeps them correct if the
 * proxy matcher ever changes: a tenant host gets the tenant answer (via `src/server/site-seo.ts`),
 * an unknown host gets nothing.
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
