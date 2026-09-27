import Link from "next/link";
import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getFeaturedProperties } from "../queries";
import { rs } from "../strings";
import { PropertyCard } from "./property-card";

/** Server section for home pages: featured listings (optionally only SALE or RENT). Renders nothing when empty. */
export async function FeaturedProperties({
  ctx,
  take = 6,
  purpose,
  eyebrow,
  title,
  subtitle,
  className,
  bare,
}: {
  ctx: SiteContext;
  take?: number;
  purpose?: "SALE" | "RENT";
  eyebrow?: LocalizedString | string;
  title?: LocalizedString | string;
  subtitle?: LocalizedString | string;
  className?: string;
  bare?: boolean;
}) {
  const items = await getFeaturedProperties(ctx.tenant.id, take, purpose);
  if (items.length === 0) return null;
  const grid = (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <PropertyCard key={p.id} property={p} ctx={ctx} />
      ))}
    </div>
  );
  if (bare) return grid;
  return (
    <section className={cn("py-14 sm:py-20", className)} id="properties">
      <Container>
        <SectionHeading eyebrow={eyebrow ?? t(rs.properties, ctx.lang)} title={title ?? rs.featuredProperties} subtitle={subtitle} lang={ctx.lang} />
        {grid}
        <div className="mt-8 text-center">
          <Link href={purpose ? `/properties?purpose=${purpose}` : "/properties"} className="t-btn t-btn-outline">
            {t(rs.viewAll, ctx.lang)}
          </Link>
        </div>
      </Container>
    </section>
  );
}
