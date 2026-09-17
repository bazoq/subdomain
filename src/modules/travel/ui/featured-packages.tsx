import Link from "next/link";
import type { SiteContext } from "@/templates/types";
import { Container, SectionHeading } from "@/templates/ui";
import { t, type LocalizedString } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getFeaturedPackages } from "../queries";
import { ts } from "../strings";
import { PackageCard } from "./package-card";

/** Server section for home pages: featured packages (optionally of one kind). Renders nothing when empty. */
export async function FeaturedPackages({
  ctx,
  take = 6,
  kind,
  eyebrow,
  title,
  subtitle,
  className,
  bare,
}: {
  ctx: SiteContext;
  take?: number;
  kind?: string;
  eyebrow?: string;
  title?: LocalizedString | string;
  subtitle?: LocalizedString | string;
  className?: string;
  bare?: boolean;
}) {
  const items = await getFeaturedPackages(ctx.tenant.id, take, kind);
  if (items.length === 0) return null;
  const grid = (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} ctx={ctx} />
      ))}
    </div>
  );
  if (bare) return grid;
  return (
    <section className={cn("py-14 sm:py-20", className)} id="packages">
      <Container>
        <SectionHeading eyebrow={eyebrow ?? t(ts.packages, ctx.lang)} title={title ?? ts.featuredPackages} subtitle={subtitle} lang={ctx.lang} />
        {grid}
        <div className="mt-8 text-center">
          <Link href={kind ? `/packages?kind=${kind}` : "/packages"} className="t-btn t-btn-outline">
            {t(ts.viewAll, ctx.lang)}
          </Link>
        </div>
      </Container>
    </section>
  );
}
