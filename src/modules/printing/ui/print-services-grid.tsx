import type { SiteContext } from "@/templates/types";
import type { LocalizedString } from "@/lib/i18n";
import { ServicesBlock } from "@/modules/shared/ui/services-block";

/** Printing services = Service rows with image cards and "From Rs X" pricing. */
export function PrintServicesGrid({
  ctx,
  columns = 3,
  take = 12,
  featuredOnly,
  light,
  className,
  bare,
  heading,
  showFeatures,
}: {
  ctx: SiteContext;
  columns?: 2 | 3 | 4;
  take?: number;
  featuredOnly?: boolean;
  light?: boolean;
  className?: string;
  bare?: boolean;
  heading?: { eyebrow?: LocalizedString | string; title?: LocalizedString; subtitle?: LocalizedString };
  showFeatures?: boolean;
}) {
  return (
    <ServicesBlock
      ctx={ctx}
      id="print-services"
      variant="image"
      columns={columns}
      take={take}
      featuredOnly={featuredOnly}
      light={light}
      className={className}
      bare={bare}
      showPrice
      showFeatures={showFeatures}
      heading={heading ?? { eyebrow: ctx.lang === "ur" ? "خدمات" : "What we print", title: { en: "Printing services", ur: "پرنٹنگ خدمات" } }}
    />
  );
}
