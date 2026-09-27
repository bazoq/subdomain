import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui } from "@/lib/i18n";
import { CartPage, EcommerceProviders, PageTitle, sui, toStoreCtx } from "@/modules/ecommerce/ui";

/** Transactional page: never indexed (also listed in TENANT_DISALLOW). */
export async function generateMetadata(): Promise<Metadata> {
  const [ctx, tc] = await Promise.all([getSiteContext(), requireTenant()]);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.cart, ctx.lang), path: "/cart", noIndex: true });
}

export default async function CartRoute() {
  const ctx = await getSiteContext();
  requireModulePage(ctx, "ecommerce");
  return (
    <EcommerceProviders ctx={ctx}>
      <PageTitle title={t(sui.cartTitle, ctx.lang)} crumbs={[{ label: t(ui.home, ctx.lang), href: "/" }, { label: t(ui.shop, ctx.lang), href: "/shop" }, { label: t(ui.cart, ctx.lang) }]} />
      <div className="t-container py-8 sm:py-10">
        <CartPage ctx={toStoreCtx(ctx)} />
      </div>
    </EcommerceProviders>
  );
}
