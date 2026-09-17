import { Check, MapPin, Package } from "lucide-react";
import { Img } from "@/templates/ui";
import { t, ui } from "@/lib/i18n";
import { cn, formatDate, formatPKR } from "@/lib/utils";
import { orderLabel } from "../pricing";
import type { LangCtx, OrderDTO } from "../types";
import { STATUS_LABEL, sui } from "./strings";

const FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export function statusLabel(status: string, lang: LangCtx["lang"]): string {
  const key = STATUS_LABEL[status];
  return key ? t(sui[key], lang) : status.replace(/_/g, " ");
}

/** Progress stepper for the standard fulfilment flow; cancelled / returned render as a notice. */
export function OrderStatusSteps({ status, ctx, className }: { status: string; ctx: LangCtx; className?: string }) {
  const lang = ctx.lang;
  if (status === "CANCELLED" || status === "RETURNED") {
    return (
      <div className={cn("rounded-[var(--t-radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700", className)}>
        {t(sui.orderStatus, lang)}: {statusLabel(status, lang)}
      </div>
    );
  }
  const idx = Math.max(0, FLOW.indexOf(status as (typeof FLOW)[number]));
  return (
    <ol className={cn("grid grid-cols-5 gap-1", className)} aria-label={t(sui.orderStatus, lang)}>
      {FLOW.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="flex flex-col items-center text-center" aria-current={i === idx ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : done ? "bg-t-primary" : "bg-t-border")} />
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold", done ? "border-t-primary bg-t-primary text-t-primary-fg" : "border-t-border bg-t-card text-t-muted-fg")}>
                {done && i < idx ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("h-0.5 flex-1", i === FLOW.length - 1 ? "bg-transparent" : i < idx ? "bg-t-primary" : "bg-t-border")} />
            </div>
            <span className={cn("mt-1.5 text-[11px] leading-tight sm:text-xs", done ? "font-semibold" : "text-t-muted-fg")}>{statusLabel(s, lang)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Customer-facing order details: status, items, totals, address and timeline. */
export function OrderSummary({ order, ctx, prefix = "ORD", className }: { order: OrderDTO; ctx: LangCtx; prefix?: string; className?: string }) {
  const lang = ctx.lang;
  return (
    <div className={cn("space-y-6", className)}>
      <div className="t-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-t-muted-fg">{t(ui.orderNumber, lang)}</p>
            <p className="font-heading text-2xl font-bold">{orderLabel(prefix, order.number)}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-t-muted-fg">{t(sui.placedOn, lang)}</p>
            <p className="font-medium">{formatDate(order.createdAt, true)}</p>
          </div>
        </div>
        <OrderStatusSteps status={order.status} ctx={ctx} className="mt-6" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="t-card p-5 lg:col-span-2">
          <h3 className="font-heading mb-3 inline-flex items-center gap-2 text-base font-semibold">
            <Package className="size-4" /> {t(sui.items, lang)}
          </h3>
          <ul className="divide-y divide-t-border">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <Img src={i.imageUrl ?? undefined} alt="" className="size-14 shrink-0 rounded-[var(--t-radius)] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-t-muted-fg">
                    {i.variantName ? `${i.variantName} · ` : ""}
                    {i.quantity} × {formatPKR(i.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatPKR(i.total)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-t-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-t-muted-fg">{t(ui.subtotal, lang)}</dt>
              <dd>{formatPKR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-t-muted-fg">{t(ui.shipping, lang)}</dt>
              <dd>{order.shipping ? formatPKR(order.shipping) : t(sui.free, lang)}</dd>
            </div>
            {order.discount ? (
              <div className="flex justify-between text-emerald-700">
                <dt>
                  {t(ui.discount, lang)}
                  {order.couponCode ? ` (${order.couponCode})` : ""}
                </dt>
                <dd>-{formatPKR(order.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between pt-1 text-base font-bold">
              <dt>{t(ui.total, lang)}</dt>
              <dd>{formatPKR(order.total)}</dd>
            </div>
            <p className="pt-1 text-xs text-t-muted-fg">
              {t(ui.cashOnDelivery, lang)} · {order.paymentMethod}
            </p>
          </dl>
        </div>
        <div className="space-y-6">
          <div className="t-card p-5">
            <h3 className="font-heading mb-2 inline-flex items-center gap-2 text-base font-semibold">
              <MapPin className="size-4" /> {t(sui.deliverTo, lang)}
            </h3>
            <p className="text-sm font-medium">{order.customerName}</p>
            <p className="text-sm text-t-muted-fg">{order.customerPhone}</p>
            <p className="mt-2 whitespace-pre-line text-sm">
              {order.address}
              {"\n"}
              {order.city}
            </p>
            {order.giftMessage ? <p className="mt-3 rounded-[var(--t-radius)] bg-t-muted p-2 text-xs italic">“{order.giftMessage}”</p> : null}
            {order.hasPrescription ? <p className="mt-2 text-xs text-sky-700">{t(ui.prescriptionRequired, lang)} ✓</p> : null}
          </div>
          {order.timeline.length ? (
            <div className="t-card p-5">
              <h3 className="font-heading mb-3 text-base font-semibold">{t(sui.orderStatus, lang)}</h3>
              <ol className="space-y-3 text-sm">
                {[...order.timeline].reverse().map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-t-primary" />
                    <div>
                      <p className="font-medium">{statusLabel(e.status, lang)}</p>
                      {e.note ? <p className="text-xs text-t-muted-fg">{e.note}</p> : null}
                      {e.at ? <p className="text-xs text-t-muted-fg">{formatDate(e.at, true)}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
