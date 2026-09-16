import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import { fieldsSchema } from "@/templates/fields";
import { getTemplateMeta } from "@/templates/registry";
import type { SectionState, SiteContext, TemplateMeta } from "@/templates/types";
import type { TenantContext } from "@/server/tenant";
import type { Lang } from "@/lib/i18n";
import { ui } from "@/lib/i18n";

/** Deep-merge saved data over template defaults, then validate. Unknown keys are dropped. */
export function normaliseSectionData(meta: TemplateMeta, key: string, saved: unknown): Record<string, unknown> | null {
  const def = meta.sections.find((s) => s.key === key);
  if (!def) return null;
  const merged = { ...(def.defaults as Record<string, unknown>), ...((saved as Record<string, unknown>) ?? {}) };
  const parsed = fieldsSchema(def.fields).safeParse(merged);
  if (parsed.success) return parsed.data as Record<string, unknown>;
  // fall back to defaults if the stored blob is corrupt
  return def.defaults as Record<string, unknown>;
}

export const loadSections = cache(async (tenantId: string, meta: TemplateMeta) => {
  const rows = await db.siteSection.findMany({ where: { tenantId } });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const sections: Record<string, SectionState> = {};
  meta.sections.forEach((def, i) => {
    const row = byKey.get(def.key);
    const data = normaliseSectionData(meta, def.key, row?.data) ?? (def.defaults as Record<string, unknown>);
    sections[def.key] = {
      enabled: row ? row.enabled || def.canDisable === false : true,
      sortOrder: row?.sortOrder ?? i,
      data,
    };
  });
  return sections;
});

export async function buildSiteContext(tc: TenantContext, lang: Lang): Promise<SiteContext | null> {
  const meta = getTemplateMeta(tc.tenant.templateId);
  if (!meta) return null;
  const [sections, pages] = await Promise.all([
    loadSections(tc.tenant.id, meta),
    db.sitePage.findMany({
      where: { tenantId: tc.tenant.id, enabled: true },
      select: { slug: true, title: true, showInNav: true },
      orderBy: { sortOrder: "asc" },
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

  return {
    tenant: tc.tenant,
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
    langHref: (l) => `?lang=${l}`,
  };
}

export { ui };
