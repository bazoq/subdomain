import type { Metadata } from "next";
import { getSiteContext } from "@/server/site";
import { t, ui } from "@/lib/i18n";
import { getOrderByNumber } from "@/modules/ecommerce/queries";
import { firstParam, verifyOrderToken } from "@/modules/ecommerce/order-token";
import { EcommerceProviders, OrderSuccess, OrderSummary, OrderTracker, PageTitle, orderLabel, sui, toStoreCtx } from "@/modules/ecommerce/ui";

type Params = { number: string };
type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.trackOrder, ctx.lang)} · ${ctx.tenant.name}`, robots: { index: false, follow: false } };
}

/**
 * /order/[number]?t=<HMAC token>
 * The token is issued by `placeOrder` (checkout redirect) and by `getOrderStatus` (after the visitor proves the full phone
 * number). Order numbers are sequential, so without a valid token the page only shows the tracker form — never order data.
 */
export default async function OrderRoute({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const [ctx, { number }, sp] = await Promise.all([getSiteContext(), params, searchParams]);
  const n = parseInt(String(number).replace(/\D/g, ""), 10);
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
