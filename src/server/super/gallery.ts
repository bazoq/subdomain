import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import { TEMPLATES, getTemplateMeta } from "@/templates/registry";
import type { TemplateMeta } from "@/templates/types";

/**
 * Public-gallery view of the code template registry, honouring the super-admin overrides in
 * `TemplateSetting` (enabled / featured / sortOrder). Every reader falls back to "all enabled,
 * registry order" if the database is unreachable, so the marketing site never breaks on a DB blip.
 */

export interface GalleryTemplate {
  meta: TemplateMeta;
  featured: boolean;
  sortOrder: number;
}

/** Curated fallback for the home page when no template has been marked featured yet. */
const DEFAULT_FEATURED = ["pizza-01", "clothing-01", "recruiting-01", "travel-02", "medical-01", "law-01", "realestate-01", "gym-02"];

const loadSettings = cache(async () => {
  const rows = await db.templateSetting.findMany().catch(() => []);
  return new Map(rows.map((r) => [r.templateId, r]));
});

function byOrder(a: GalleryTemplate, b: GalleryTemplate) {
  return a.sortOrder - b.sortOrder || a.meta.code - b.meta.code;
}

/** All enabled templates in gallery order. */
export const getGalleryTemplates = cache(async (): Promise<GalleryTemplate[]> => {
  const settings = await loadSettings();
  return TEMPLATES.filter((t) => settings.get(t.id)?.enabled ?? true)
    .map((meta) => {
      const s = settings.get(meta.id);
      return { meta, featured: s?.featured ?? false, sortOrder: s?.sortOrder ?? 0 };
    })
    .sort(byOrder);
});

export async function getGalleryMetas(): Promise<TemplateMeta[]> {
  return (await getGalleryTemplates()).map((g) => g.meta);
}

export async function galleryTemplatesForCategory(category: string): Promise<TemplateMeta[]> {
  return (await getGalleryTemplates()).filter((g) => g.meta.category === category).map((g) => g.meta);
}

/** One template for its public detail page; null when unknown or disabled by the super admin. */
export async function getGalleryTemplate(id: string): Promise<TemplateMeta | null> {
  const meta = getTemplateMeta(id);
  if (!meta) return null;
  const settings = await loadSettings();
  return (settings.get(id)?.enabled ?? true) ? meta : null;
}

/** Featured templates for the home page: admin-featured first (by sortOrder), padded with the curated defaults. */
export async function getFeaturedTemplates(limit = 8): Promise<TemplateMeta[]> {
  const all = await getGalleryTemplates();
  const featured = all.filter((g) => g.featured).map((g) => g.meta);
  if (featured.length >= limit) return featured.slice(0, limit);
  const enabled = new Set(all.map((g) => g.meta.id));
  const used = new Set(featured.map((t) => t.id));
  const out: TemplateMeta[] = [...featured];
  for (const id of DEFAULT_FEATURED) {
    if (out.length >= limit) break;
    const t = getTemplateMeta(id);
    if (t && enabled.has(id) && !used.has(id)) {
      out.push(t);
      used.add(id);
    }
  }
  for (const g of all) {
    if (out.length >= limit) break;
    if (!used.has(g.meta.id)) {
      out.push(g.meta);
      used.add(g.meta.id);
    }
  }
  return out;
}
