import type { SiteContext } from "@/templates/types";
import { FeaturesBlock } from "@/modules/shared/ui/section-blocks";
import type { FeaturesData } from "@/modules/shared/ui/section-types";

/** "Why choose our firm" — the `features` section rendered as a list/grid. */
export function WhyChooseUs({ ctx, variant = "list", columns, light, className, bare, data }: { ctx: SiteContext; variant?: "grid" | "list" | "alternating"; columns?: 2 | 3 | 4; light?: boolean; className?: string; bare?: boolean; data?: Partial<FeaturesData> }) {
  return <FeaturesBlock ctx={ctx} id="why-us" variant={variant} columns={columns} light={light} className={className} bare={bare} data={data} />;
}
