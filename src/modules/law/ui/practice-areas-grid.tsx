import type { SiteContext } from "@/templates/types";
import type { LocalizedString } from "@/lib/i18n";
import { ServicesBlock } from "@/modules/shared/ui/services-block";

/** Practice areas = Service rows rendered with the icon card variant. */
export function PracticeAreasGrid({
  ctx,
  columns = 3,
  take = 9,
  featuredOnly,
  light,
  className,
  bare,
  heading,
  variant = "icon",
}: {
  ctx: SiteContext;
  columns?: 2 | 3 | 4;
  take?: number;
  featuredOnly?: boolean;
  light?: boolean;
  className?: string;
  bare?: boolean;
  heading?: { eyebrow?: string; title?: LocalizedString; subtitle?: LocalizedString };
  variant?: "icon" | "list";
}) {
  return (
    <ServicesBlock
      ctx={ctx}
      id="practice-areas"
      variant={variant}
      columns={columns}
      take={take}
      featuredOnly={featuredOnly}
      light={light}
      className={className}
      bare={bare}
      showPrice={false}
      heading={heading ?? { eyebrow: ctx.lang === "ur" ? "خدمات" : "Expertise", title: { en: "Practice areas", ur: "شعبہ جات" } }}
    />
  );
}
