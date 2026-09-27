import { notFound } from "next/navigation";
import type { ModuleKey } from "@/lib/categories";
import { fail, type ActionResult } from "@/lib/action-result";

/**
 * Module gating. A tenant's business category decides which modules exist for it
 * (`src/lib/categories.ts`). Routes and admin actions for a module must refuse to work for
 * tenants of other categories: a bakery has no `/jobs`, a recruiting agency has no `/properties`.
 *
 *  - `hasModule`         – predicate.
 *  - `requireModulePage` – for server components / generateMetadata: renders the 404 page.
 *  - `moduleUnavailable` – for server actions: a plain failure result (admin UI is English).
 */
type WithCategory = { category: { modules: readonly ModuleKey[] } };

export function hasModule(ctx: WithCategory, key: ModuleKey): boolean {
  return ctx.category.modules.includes(key);
}

export function requireModulePage(ctx: WithCategory, key: ModuleKey): void {
  if (!hasModule(ctx, key)) notFound();
}

export const MODULE_UNAVAILABLE = "This feature is not available for your business type.";

export function moduleUnavailable(): ActionResult<never> {
  return fail(MODULE_UNAVAILABLE);
}
