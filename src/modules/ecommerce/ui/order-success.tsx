import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn, whatsappLink } from "@/lib/utils";
import { orderLabel } from "../pricing";
import type { OrderDTO, StoreCtx } from "../types";
import { OrderSummary } from "./order-summary";
import { sui } from "./strings";

/** "Thank you" banner + full summary shown right after checkout. */
export function OrderSuccess({ order, ctx, className }: { order: OrderDTO; ctx: StoreCtx; className?: string }) {
  const lang = ctx.lang;
  const label = orderLabel(ctx.commerce.orderPrefix, order.number);
  const wa = ctx.contact.whatsapp || ctx.contact.phone;
  return (
    <div className={cn("space-y-6", className)}>
      <div className="rounded-[var(--t-radius)] border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h2 className="font-heading mt-3 text-2xl font-bold">{t(sui.orderReceived, lang)}</h2>
        <p className="mt-1 text-sm">{t(sui.orderReceivedSub, lang)}</p>
        <p className="mt-4 text-sm">{t(sui.yourOrderNumber, lang)}</p>
        <p className="font-heading text-3xl font-bold tracking-wide">{label}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {wa ? (
            <a href={whatsappLink(wa, `Assalam o Alaikum, I just placed order ${label} on ${ctx.tenantName}.`)} target="_blank" rel="noreferrer" className="t-btn bg-[#25D366] text-white">
              <MessageCircle className="size-4" /> {t(ui.whatsapp, lang)}
            </a>
          ) : null}
          <Link href="/shop" className="t-btn t-btn-outline">
            {t(ui.continueShopping, lang)}
          </Link>
        </div>
      </div>
      <OrderSummary order={order} ctx={ctx} prefix={ctx.commerce.orderPrefix} />
    </div>
  );
}
