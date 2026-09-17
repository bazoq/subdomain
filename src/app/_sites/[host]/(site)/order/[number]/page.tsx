import type { Metadata } from "next";
import { getSiteContext } from "@/server/site";
import { t, ui } from "@/lib/i18n";
import { getOrderByNumber } from "@/modules/ecommerce/queries";
import { EcommerceProviders, OrderSuccess, OrderSummary, OrderTracker, PageTitle, orderLabel, phoneLast4, sui, toStoreCtx } from "@/modules/ecommerce/ui";

type Params = { number: string };
type Search = { p?: string; new?: string };

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getSiteContext();
  return { title: `${t(ui.trackOrder, ctx.lang)} · ${ctx.tenant.name}`, robots: { index: false, follow: false } };
}

/**
 * /order/[number]?p=<last 4 digits of phone>
 * The order is shown only when `p` matches the phone used at checkout; otherwise the visitor
 * verifies with the full phone number via the tracker (server action).
 */
export default async function OrderRoute({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const [ctx, { number }, sp] = await Promise.all([getSiteContext(), params, searchParams]);
  const n = parseInt(String(number).replace(/\D/g, ""), 10);
  const order = await getOrderByNumber(ctx.tenant.id, n);
  const verified = !!order && !!sp.p && /^\d{4}$/.test(sp.p) && phoneLast4(order.customerPhone) === sp.p;
  const store = toStoreCtx(ctx);
  const label = Number.isFinite(n) && n > 0 ? orderLabel(ctx.settings.commerce.orderPrefix, n) : "";

  return (
    <EcommerceProviders ctx={ctx}>
      <PageTitle
        title={verified ? `${t(ui.orderNumber, ctx.lang)} ${label}` : t(sui.trackTitle, ctx.lang)}
        subtitle={verified ? undefined : t(sui.verifyPhone, ctx.lang)}
        crumbs={[{ label: t(ui.home, ctx.lang), href: "/" }, { label: t(ui.trackOrder, ctx.lang) }]}
      />
      <div className="t-container py-8 sm:py-10">
        {verified && order ? (
          sp.new === "1" ? (
            <OrderSuccess order={order} ctx={store} />
          ) : (
            <OrderSummary order={order} ctx={ctx} prefix={ctx.settings.commerce.orderPrefix} />
          )
        ) : (
          <OrderTracker ctx={store} initialNumber={label} />
        )}
      </div>
    </EcommerceProviders>
  );
}
