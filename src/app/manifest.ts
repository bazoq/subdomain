import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { getTemplateMeta } from "@/templates/registry";
import { resolveSeoHost } from "@/server/super/host-seo";

/**
 * Host-aware web app manifest. The platform gets its own branding; a tenant host gets the tenant's
 * name and template colours so "Add to home screen" on a customer's site looks like their brand.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const resolved = await resolveSeoHost();

  if (resolved.kind === "tenant") {
    const { tc } = resolved;
    const meta = getTemplateMeta(tc.tenant.templateId);
    const primary = tc.settings.branding.primaryColor || meta?.theme.colors.primary || brand.colors.primary;
    const favicon = tc.settings.branding.faviconUrl;
    return {
      name: tc.tenant.name,
      short_name: tc.tenant.name.slice(0, 12),
      description: tc.settings.seo.description || `${tc.tenant.name} — ${tc.category.name}`,
      start_url: "/",
      display: "standalone",
      background_color: meta?.theme.colors.bg ?? "#ffffff",
      theme_color: primary,
      lang: tc.settings.languages.urduEnabled ? "ur" : "en",
      icons: favicon ? [{ src: favicon, sizes: "any" }] : [],
    };
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
