import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "@/server/db";

/**
 * Cross-request cache for a tenant's section content (the one large read on every public page).
 *
 * Model: Next.js data cache (`unstable_cache`, the non-Cache-Components API in Next 16) keyed by
 * tenant id and tagged `tenant-content:<id>`. Every write path in `src/server/content/actions.ts`
 * calls `revalidateTenantContent()` right after the DB write; the tag is expired immediately
 * (`{ expire: 0 }`), so the admin's next render reads fresh rows (read-your-own-writes). A short
 * `revalidate` window is a safety net for writers outside this module (super-admin template switch,
 * seed re-runs): they can be at most CONTENT_TTL_SECONDS stale until they adopt the helper.
 *
 * What is NOT cached on purpose: the tenant row itself (status/suspension, settings, domains) is
 * resolved per request in `src/server/tenant.ts`, so suspending or re-pointing a site is immediate,
 * and `SitePage` navigation rows (tiny indexed query, written by `src/modules/shared/pages-actions.ts`).
 *
 * Cached values must be JSON-serialisable: only plain columns are selected (no Date objects).
 */

export const CONTENT_TTL_SECONDS = 60;

export function contentTag(tenantId: string): string {
  return `tenant-content:${tenantId}`;
}

export interface SectionRow {
  key: string;
  enabled: boolean;
  sortOrder: number;
  data: unknown;
}

async function querySectionRows(tenantId: string): Promise<SectionRow[]> {
  const rows = await db.siteSection.findMany({
    where: { tenantId },
    select: { key: true, enabled: true, sortOrder: true, data: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({ key: r.key, enabled: r.enabled, sortOrder: r.sortOrder, data: r.data }));
}

/** Raw `SiteSection` rows for a tenant, served from the tagged data cache. */
export async function getSectionRows(tenantId: string): Promise<SectionRow[]> {
  const cached = unstable_cache(querySectionRows, ["site-section-rows"], {
    tags: [contentTag(tenantId)],
    revalidate: CONTENT_TTL_SECONDS,
  });
  return cached(tenantId);
}

/**
 * Expire the cached content of one tenant. Call after any write to `SiteSection` (and after
 * provisioning / template switches / tenant deletion). Safe to call from server actions and route
 * handlers; the next request blocks on a fresh read instead of being served stale data.
 */
export function revalidateTenantContent(tenantId: string): void {
  revalidateTag(contentTag(tenantId), { expire: 0 });
}
