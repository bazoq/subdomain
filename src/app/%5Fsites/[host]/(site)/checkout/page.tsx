import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui } from "@/lib/i18n";
import { getShippingZones } from "@/modules/ecommerce/queries";
import { CheckoutForm, EcommerceProviders, PageTitle, sui, toStoreCtx } from "@/modules/ecommerce/ui";

/** Transactional page: never indexed (also listed in TENANT_DISALLOW). */
export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.checkout, ctx.lang), path: "/checkout", noIndex: true });
}

export default async function CheckoutRoute() {
  const ctx = await getSiteContext();
  requireModulePage(ctx, "ecommerce");
  const zones = await getShippingZones(ctx.tenant.id);
  return (
    <EcommerceProviders ctx={ctx}>
      <PageTitle title={t(sui.checkoutTitle, ctx.lang)} subtitle={t(ui.cashOnDelivery, ctx.lang)} crumbs={[{ label: t(ui.cart, ctx.lang), href: "/cart" }, { label: t(ui.checkout, ctx.lang) }]} />
      <div className="t-container py-8 sm:py-10">
        <CheckoutForm ctx={toStoreCtx(ctx)} zones={zones} showGiftMessage={ctx.category.key === "gifts"} />
      </div>
    </EcommerceProviders>
  );
}
