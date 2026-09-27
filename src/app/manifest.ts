import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { resolveLang } from "@/lib/i18n";
import { resolveSeoHost } from "@/server/super/host-seo";
import { buildTenantManifest } from "@/server/site-seo";

/**
 * Host-aware web app manifest. The platform gets its own branding; a tenant host (should the proxy ever
 * stop rewriting `/manifest.webmanifest` to the tenant tree) gets the tenant's name and colours from the
 * shared builder in `src/server/site-seo.ts`.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const resolved = await resolveSeoHost();

  if (resolved.kind === "tenant") {
    const { tc } = resolved;
    return buildTenantManifest(tc, resolveLang(null, tc.settings.languages));
  }

  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.tagline,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: brand.colors.primary,
    lang: "en",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
