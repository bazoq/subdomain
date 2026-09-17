import type { SiteContext } from "@/templates/types";
import { StatsBlock } from "@/modules/shared/ui/section-blocks";
import type { StatsData } from "@/modules/shared/ui/section-types";

/** Case results / track record numbers from the `stats` section (e.g. "1,200+ cases won"). */
export function CaseResultsStrip({ ctx, variant = "row", light = true, className, bare, data }: { ctx: SiteContext; variant?: "row" | "cards"; light?: boolean; className?: string; bare?: boolean; data?: Partial<StatsData> }) {
  return <StatsBlock ctx={ctx} id="case-results" variant={variant} light={light} className={className} bare={bare} data={data} />;
}
