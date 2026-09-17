import * as React from "react";
import type { SiteContext } from "@/templates/types";

/**
 * Render a template home page honouring the tenant's section order and enable/disable
 * toggles. `renderers` maps section keys to render functions; sections without a
 * renderer (e.g. "seo", "footer", "hero" when rendered separately) are skipped.
 *
 * Usage:
 *   <>{renderOrdered(ctx, { about: () => <AboutBlock ctx={ctx} />, ... }, ["hero", "footer", "seo"])}</>
 */
export function renderOrdered(
  ctx: SiteContext,
  renderers: Record<string, () => React.ReactNode>,
  skip: string[] = ["hero", "footer", "seo"],
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  for (const s of ctx.orderedSections) {
    if (skip.includes(s.key)) continue;
    const r = renderers[s.key];
    if (!r) continue;
    out.push(<React.Fragment key={s.key}>{r()}</React.Fragment>);
  }
  return out;
}

/** True when the section exists and is enabled for this tenant. */
export function enabled(ctx: SiteContext, key: string) {
  return Boolean(ctx.sections[key]?.enabled);
}
