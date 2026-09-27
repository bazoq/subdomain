import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { absoluteUrl } from "@/config/site";
import { CATEGORIES } from "@/lib/categories";
import { getGalleryTemplates } from "@/server/super/gallery";
import { resolveSeoHost } from "@/server/super/host-seo";
import { buildTenantSitemap } from "@/server/site-seo";

/**
 * Host-aware sitemap. This file answers for whichever host the request arrived on:
 *  - platform / preview host -> marketing-site sitemap (below)
 *  - tenant host             -> that tenant's sitemap (empty for demo / non-active tenants)
 *  - unknown host            -> empty
 * Reading the request host makes the route dynamic, which is what we want (per-host output).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const resolved = await resolveSeoHost();
  if (resolved.kind === "tenant") return buildTenantSitemap(resolved.tc, resolved.host);
  if (resolved.kind === "unknown") return [];
  return platformSitemap();
}

const STATIC_PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/templates", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
];

async function platformSitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [templates, posts] = await Promise.all([
    getGalleryTemplates(),
    db.blogPost
      .findMany({ where: { published: true }, select: { category: true, slug: true, updatedAt: true, publishedAt: true }, orderBy: { publishedAt: "desc" } })
      .catch(() => [] as { category: string; slug: string; updatedAt: Date; publishedAt: Date | null }[]),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({ url: absoluteUrl(p.path), lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority }));

  for (const c of CATEGORIES) {
    entries.push({ url: absoluteUrl(`/templates/${c.key}`), lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    entries.push({ url: absoluteUrl(`/blog/${c.key}`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  }
  if (posts.some((p) => p.category === "general")) {
    entries.push({ url: absoluteUrl("/blog/general"), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  }

  for (const { meta } of templates) {
    entries.push({
      url: absoluteUrl(`/templates/${meta.category}/${meta.id}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      images: [absoluteUrl(`/templates/${meta.category}/${meta.id}/opengraph-image`)],
    });
  }

  for (const p of posts) {
    entries.push({ url: absoluteUrl(`/blog/${p.category}/${p.slug}`), lastModified: p.updatedAt ?? p.publishedAt ?? now, changeFrequency: "monthly", priority: 0.6 });
  }

  return entries;
}
