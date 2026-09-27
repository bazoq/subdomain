import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { resolveSeoHost, tenantRobotsFallback } from "@/server/super/host-seo";

/**
 * Host-aware robots.txt: the platform site, a tenant site, or "disallow everything" for hosts we
 * do not recognise (and for demo / non-active tenants, via the tenant fallback).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const resolved = await resolveSeoHost();
  if (resolved.kind === "tenant") return tenantRobotsFallback(resolved.tc, resolved.host);
  if (resolved.kind === "unknown") return { rules: { userAgent: "*", disallow: "/" } };

  // Vercel preview deployments must never be indexed as duplicates of the real site.
  if (resolved.host.endsWith(".vercel.app")) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/super", "/super/", "/api/", "/_sites/", "/login"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
