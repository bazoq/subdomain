import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Phone } from "lucide-react";
import { getSiteContext } from "@/server/site";
import { db } from "@/server/db";
import { t, ui } from "@/lib/i18n";
import { formatPKR, whatsappLink } from "@/lib/utils";
import { firstParam, verifyOrderToken } from "@/modules/ecommerce/order-token";
import { rs } from "@/modules/restaurant/strings";
import { toFoodOrderDto } from "@/modules/restaurant/serialize";
import { orderTypeLabel, toRestaurantCtx } from "@/modules/restaurant/types";
import { OrderLookup } from "@/modules/restaurant/ui/order-lookup";
import { OrderTracker } from "@/modules/restaurant/ui/order-tracker";

type Params = Promise<{ number: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const PK_TIME: Intl.DateTimeFormatOptions = { timeZone: "Asia/Karachi", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const ctx = await getSiteContext();
  const { number } = await params;
  return { title: `${t(ui.orderNumber, ctx.lang)} #${number} · ${ctx.tenant.name}`, robots: { index: false, follow: false } };
}

/**
 * /menu/order/[number]?t=<HMAC token>
 * The token comes from the checkout redirect or from `lookupFoodOrder` (order number + full phone). Without a valid
 * token the page shows only the lookup form — order numbers are sequential, so nothing else may be revealed.
 */
export default async function OrderStatusPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const ctx = await getSiteContext();
  const { number } = await params;
  const sp = await searchParams;
  const n = Number(number);
  if (!Number.isInteger(n) || n <= 0) notFound();
  const lang = ctx.lang;
  const rc = toRestaurantCtx(ctx);
  const token = firstParam(sp.t);
  const verified = verifyOrderToken("food", ctx.tenant.id, n, token);
  const row = verified ? await db.foodOrder.findFirst({ where: { tenantId: ctx.tenant.id, number: n }, include: { items: true } }) : null;

  if (!row) {
    return (
      <div className="t-container py-12 sm:py-20">
        <OrderLookup ctx={rc} initialNumber={n} />
      </div>
    );
  }

  const order = toFoodOrderDto(row);
  const wa = ctx.settings.contact.whatsapp || ctx.settings.contact.phone;

  return (
    <div className="t-container py-8 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="size-5" />
              {t(rs.orderReceived, lang)}
            </p>
            <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight">
              {t(ui.orderNumber, lang)} #{order.number}
            </h1>
            <p className="mt-1 text-sm text-t-muted-fg">
              {orderTypeLabel(order.type, lang)}
              {order.area ? ` · ${order.area}` : ""}
              {order.tableNumber ? ` · ${t(rs.tableNumber, lang)} ${order.tableNumber}` : ""}
              {" · "}
              {new Date(order.createdAt).toLocaleString("en-PK", PK_TIME)}
            </p>
            {order.scheduledFor ? (
              <p className="mt-1 text-sm font-medium">
                {t(rs.scheduledFor, lang)}: {new Date(order.scheduledFor).toLocaleString("en-PK", PK_TIME)}
              </p>
            ) : null}
          </div>
          {wa ? (
            <a href={whatsappLink(wa, `Hi, I'm asking about order #${order.number}`)} target="_blank" rel="noreferrer" className="t-btn t-btn-outline text-sm">
              <Phone className="size-4" />
              {t(rs.callUs, lang)}
            </a>
          ) : null}
        </div>

        <OrderTracker ctx={rc} number={order.number} token={token} type={order.type} initialStatus={order.status} initialTimeline={order.timeline} estimatedMins={order.estimatedMins} createdAt={order.createdAt} />

        <div className="t-card p-5">
          <h2 className="font-heading mb-3 text-lg font-bold">{t(rs.yourOrder, lang)}</h2>
          <ul className="divide-y divide-t-border text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2">
                <span>
                  <span className="font-medium">{i.quantity} × </span>
                  {i.name}
                  {i.sizeName ? <span className="text-t-muted-fg"> ({i.sizeName})</span> : null}
                  {i.modifiers.length ? <span className="block text-xs text-t-muted-fg">{i.modifiers.map((m) => m.name).join(", ")}</span> : null}
                  {i.note ? <span className="block text-xs italic text-t-muted-fg">“{i.note}”</span> : null}
                </span>
                <span className="shrink-0 tabular-nums">{formatPKR(i.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-t-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-t-muted-fg">{t(ui.subtotal, lang)}</dt>
              <dd className="tabular-nums">{formatPKR(order.subtotal)}</dd>
            </div>
            {order.deliveryFee ? (
              <div className="flex justify-between">
                <dt className="text-t-muted-fg">{t(ui.deliveryFee, lang)}</dt>
                <dd className="tabular-nums">{formatPKR(order.deliveryFee)}</dd>
              </div>
            ) : null}
            {order.discount ? (
              <div className="flex justify-between">
                <dt className="text-t-muted-fg">{t(ui.discount, lang)}</dt>
                <dd className="tabular-nums">−{formatPKR(order.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold">
              <dt>{t(ui.total, lang)}</dt>
              <dd className="tabular-nums">{formatPKR(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-t-muted-fg">
            {t(ui.cashOnDelivery, lang)} · {order.customerName} · {order.customerPhone}
            {order.address ? ` · ${order.address}` : ""}
          </p>
        </div>

        <a href="/menu" className="t-btn t-btn-outline text-sm">
          {t(rs.browseMenu, lang)}
        </a>
      </div>
    </div>
  );
}
