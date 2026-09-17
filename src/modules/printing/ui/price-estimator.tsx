import type { SiteContext } from "@/templates/types";
import { t, type LocalizedString } from "@/lib/i18n";
import { getServices } from "@/modules/shared/queries";
import { asPriceTiers } from "@/modules/shared/content-types";
import { PriceEstimatorClient, type EstimatorService } from "@/modules/printing/ui/price-estimator-client";

/**
 * Server wrapper: reads `Service.features` as `[{ qty, price }]` tiers when shaped that way,
 * otherwise falls back to `priceFrom`. Renders nothing when no service has pricing.
 */
export async function PriceEstimator({ ctx, className, light, quoteHref }: { ctx: SiteContext; className?: string; light?: boolean; quoteHref?: string }) {
  const rows = await getServices(ctx.tenant.id, { take: 100 });
  const services: EstimatorService[] = rows.map((s) => ({ id: s.id, label: t(s.name as LocalizedString, ctx.lang), tiers: asPriceTiers(s.features), priceFrom: s.priceFrom, priceNote: s.priceNote }));
  if (!services.some((s) => s.tiers.length || s.priceFrom != null)) return null;
  return <PriceEstimatorClient lang={ctx.lang} services={services} className={className} light={light} quoteHref={quoteHref} />;
}
