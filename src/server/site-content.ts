import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import { getSectionRows, type SectionRow } from "@/server/content/cache";
import { fieldsSchema } from "@/templates/fields";
import { getTemplateMeta } from "@/templates/registry";
import type { SectionState, SiteContext, TemplateMeta } from "@/templates/types";
import type { TenantContext } from "@/server/tenant";
import type { Lang } from "@/lib/i18n";
import { ui } from "@/lib/i18n";

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/**
 * Merge saved data over the template defaults, then validate with the section's zod schema.
 * Unknown keys are dropped; a corrupt/outdated blob falls back to the defaults so a page never
 * breaks because of stored content. Returns null for a key the template does not define.
 */
export function normaliseSectionData(meta: TemplateMeta, key: string, saved: unknown): Record<string, unknown> | null {
  const def = meta.sections.find((s) => s.key === key);
  if (!def) return null;
  const defaults = def.defaults as Record<string, unknown>;
  const merged = { ...defaults, ...asObject(saved) };
  const parsed = fieldsSchema(def.fields).safeParse(merged);
  return parsed.success ? (parsed.data as Record<string, unknown>) : defaults;
}

/** Pure: template definition + stored rows → per-section state (exported for tests and the seed). */
export function buildSectionState(meta: TemplateMeta, rows: readonly SectionRow[]): Record<string, SectionState> {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const sections: Record<string, SectionState> = {};
  meta.sections.forEach((def, i) => {
    const row = byKey.get(def.key);
    const data = normaliseSectionData(meta, def.key, row?.data) ?? (def.defaults as Record<string, unknown>);
    sections[def.key] = {
      // structural sections (canDisable === false) always render, whatever a stale row says
      enabled: row ? row.enabled || def.canDisable === false : true,
      sortOrder: row?.sortOrder ?? i,
      data,
    };
  });
  return sections;
}

/**
 * Section state for a tenant. Rows come from the tagged data cache (see `content/cache.ts`);
 * React `cache` additionally dedupes within one request (layout + page + metadata all call this).
 */
export const loadSections = cache(async (tenantId: string, meta: TemplateMeta): Promise<Record<string, SectionState>> => {
  const rows = await getSectionRows(tenantId);
  return buildSectionState(meta, rows);
});

export async function buildSiteContext(tc: TenantContext, lang: Lang): Promise<SiteContext | null> {
  const meta = getTemplateMeta(tc.tenant.templateId);
  if (!meta) return null;
  const [sections, pages] = await Promise.all([
    loadSections(tc.tenant.id, meta),
    db.sitePage.findMany({
      where: { tenantId: tc.tenant.id, enabled: true },
      select: { slug: true, title: true, showInNav: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const effectiveLang: Lang = tc.settings.languages.urduEnabled ? lang : "en";
  const orderedSections = Object.entries(sections)
    .filter(([, s]) => s.enabled)
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
    .map(([key, s]) => ({ key, data: s.data }));

  const nav = [
    ...meta.nav,
    ...pages
      .filter((p) => p.showInNav)
      .map((p) => ({ label: p.title as { en: string; ur?: string }, href: `/p/${p.slug}` })),
  ];

  const { id, slug, name, category, templateId, status, isDemo } = tc.tenant;
  return {
    tenant: { id, slug, name, category, templateId, status, isDemo },
    settings: tc.settings,
    category: tc.category,
    host: tc.host,
    lang: effectiveLang,
    dir: effectiveLang === "ur" ? "rtl" : "ltr",
    template: meta,
    sections,
    orderedSections,
    nav,
    pages,
  };
}

export { ui };
