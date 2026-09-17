import type { Metadata } from "next";
import { getSiteContext } from "@/server/site";
import { t, ui } from "@/lib/i18n";
import { CartPage, EcommerceProviders, PageTitle, sui, toStoreCtx } from "@/modules/ecommerce/ui";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.cart, ctx.lang)} · ${ctx.tenant.name}`, robots: { index: false } };
}

export default async function CartRoute() {
  const ctx = await getSiteContext();
  return (
    <EcommerceProviders ctx={ctx}>
      <PageTitle title={t(sui.cartTitle, ctx.lang)} crumbs={[{ label: t(ui.home, ctx.lang), href: "/" }, { label: t(ui.shop, ctx.lang), href: "/shop" }, { label: t(ui.cart, ctx.lang) }]} />
      <div className="t-container py-8 sm:py-10">
        <CartPage ctx={toStoreCtx(ctx)} />
      </div>
    </EcommerceProviders>
  );
}
