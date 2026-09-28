import type { Metadata } from "next";
import { getSiteContext, requireTenant } from "@/server/site";
import { tenantPageMetadata } from "@/server/site-seo";
import { requireModulePage } from "@/modules/shared/module-gate";
import { t, ui } from "@/lib/i18n";
import { getOrderByNumber } from "@/modules/ecommerce/queries";
import { firstParam, verifyOrderToken } from "@/modules/ecommerce/order-token";
import { EcommerceProviders, OrderSuccess, OrderSummary, OrderTracker, PageTitle, orderLabel, sui, toStoreCtx } from "@/modules/ecommerce/ui";

type Params = { number: string };
type Search = Record<string, string | string[] | undefined>;

const orderNo = (raw: string) => parseInt(String(raw).replace(/\D/g, ""), 10);

/** Private page (token-gated): never indexed (also listed in TENANT_DISALLOW). The canonical never carries the token. */
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const [ctx, tc, { number }] = await Promise.all([getSiteContext(), requireTenant(), params]);
  const n = orderNo(number);
  return tenantPageMetadata(tc, ctx.lang, { title: t(ui.trackOrder, ctx.lang), path: Number.isFinite(n) && n > 0 ? `/order/${n}` : "/shop", noIndex: true });
}

/**
 * /order/[number]?t=<HMAC token>
 * The token is issued by `placeOrder` (checkout redirect) and by `getOrderStatus` (after the visitor proves the full phone
 * number). Order numbers are sequential, so without a valid token the page only shows the tracker form — never order data.
 */
export default async function OrderRoute({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const [ctx, { number }, sp] = await Promise.all([getSiteContext(), params, searchParams]);
  requireModulePage(ctx, "ecommerce");
  const n = orderNo(number);
  const verified = verifyOrderToken("shop", ctx.tenant.id, n, firstParam(sp.t));
  const order = verified ? await getOrderByNumber(ctx.tenant.id, n) : null;
  const store = toStoreCtx(ctx);
  const label = Number.isFinite(n) && n > 0 ? orderLabel(ctx.settings.commerce.orderPrefix, n) : "";
  const isNew = firstParam(sp.new) === "1";

  return (
    <EcommerceProviders ctx={ctx}>
      <PageTitle
        title={order ? `${t(ui.orderNumber, ctx.lang)} ${label}` : t(sui.trackTitle, ctx.lang)}
        subtitle={order ? undefined : t(sui.verifyPhone, ctx.lang)}
        crumbs={[{ label: t(ui.home, ctx.lang), href: "/" }, { label: t(ui.trackOrder, ctx.lang) }]}
      />
      <div className="t-container py-8 sm:py-10">
        {order ? isNew ? <OrderSuccess order={order} ctx={store} /> : <OrderSummary order={order} ctx={ctx} prefix={ctx.settings.commerce.orderPrefix} /> : <OrderTracker ctx={store} initialNumber={label} />}
      </div>
    </EcommerceProviders>
  );
}
