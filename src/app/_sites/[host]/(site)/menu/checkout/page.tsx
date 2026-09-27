import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { requireModulePage } from "@/modules/shared/module-gate";
import { isOpenNow } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { getDeliveryZones } from "@/modules/restaurant/queries";
import { toRestaurantCtx } from "@/modules/restaurant/types";
import { OrderProvider } from "@/modules/restaurant/ui/order-provider";
import { CheckoutForm } from "@/modules/restaurant/ui/checkout-form";

/** Transactional page: never indexed (also listed in TENANT_DISALLOW). */
export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.checkout, ctx.lang), path: "/menu/checkout", noIndex: true });
}

export default async function CheckoutPage() {
  const ctx = await getSiteContext();
  requireModulePage(ctx, "restaurant");
  const zones = await getDeliveryZones(ctx.tenant.id);
  const rc = toRestaurantCtx(ctx);
  return (
    <OrderProvider host={ctx.host}>
      <div className="t-container py-8 sm:py-12">
        <h1 className="font-heading mb-6 text-3xl font-bold tracking-tight">{t(ui.checkout, ctx.lang)}</h1>
        <CheckoutForm ctx={rc} zones={zones} isOpen={isOpenNow(ctx.settings.hours)} />
      </div>
    </OrderProvider>
  );
}
