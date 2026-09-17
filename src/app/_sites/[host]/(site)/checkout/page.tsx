import type { Metadata } from "next";
import { getSiteContext } from "@/server/site";
import { t, ui } from "@/lib/i18n";
import { getShippingZones } from "@/modules/ecommerce/queries";
import { CheckoutForm, EcommerceProviders, PageTitle, sui, toStoreCtx } from "@/modules/ecommerce/ui";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.checkout, ctx.lang)} · ${ctx.tenant.name}`, robots: { index: false } };
}

export default async function CheckoutRoute() {
  const ctx = await getSiteContext();
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
