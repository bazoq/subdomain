"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { cartKey, type StoreCtx } from "../types";
import { CartLine } from "./cart-line";
import { useCart } from "./cart-provider";
import { fmt, sui } from "./strings";

/** Full cart page body (list + summary). Render inside a CartProvider. */
export function CartPage({ ctx, className }: { ctx: StoreCtx; className?: string }) {
  const cart = useCart();
  const lang = ctx.lang;

  if (!cart.hydrated) {
    return (
      <div className={cn("py-16 text-center text-t-muted-fg", className)} aria-busy="true">
        {t(ui.loading, lang)}
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <div className={cn("t-card mx-auto max-w-md px-6 py-14 text-center", className)}>
        <ShoppingBag className="mx-auto mb-3 size-10 text-t-muted-fg" />
        <h2 className="font-heading text-xl font-semibold">{t(ui.emptyCart, lang)}</h2>
        <Link href="/shop" className="t-btn t-btn-primary mt-6">
          {t(ui.continueShopping, lang)}
        </Link>
      </div>
    );
  }
  const minOrder = ctx.commerce.minOrder;
  const belowMin = minOrder > 0 && cart.subtotal < minOrder;
  return (
    <div className={cn("grid gap-8 lg:grid-cols-3", className)}>
      <div className="t-card divide-y divide-t-border px-4 lg:col-span-2">
        <div className="flex items-center justify-between py-3 text-sm text-t-muted-fg">
          <span>{fmt(t(sui.itemsInCart, lang), { n: cart.count })}</span>
          <button type="button" onClick={cart.clear} className="hover:text-red-600">
            {t(sui.clearCart, lang)}
          </button>
        </div>
        {cart.items.map((item) => (
          <CartLine key={cartKey(item)} item={item} lang={lang} />
        ))}
      </div>
      <aside className="t-card h-fit p-5 lg:sticky lg:top-24">
        <h2 className="font-heading text-lg font-semibold">{t(sui.orderSummary, lang)}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-t-muted-fg">{t(ui.subtotal, lang)}</dt>
            <dd className="font-semibold">{formatPKR(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-t-muted-fg">{t(ui.shipping, lang)}</dt>
            <dd className="text-xs text-t-muted-fg">{t(sui.shippingAtCheckout, lang)}</dd>
          </div>
        </dl>
        {ctx.commerce.freeShippingAbove ? <p className="mt-3 text-xs text-emerald-700">{fmt(t(sui.freeShippingHint, lang), { amount: formatPKR(ctx.commerce.freeShippingAbove) })}</p> : null}
        {belowMin ? <p className="mt-3 text-xs text-amber-700">{fmt(t(sui.minOrderNotice, lang), { amount: formatPKR(minOrder) })}</p> : null}
        <Link href="/checkout" aria-disabled={belowMin} className={cn("t-btn t-btn-primary mt-5 w-full", belowMin && "pointer-events-none opacity-50")}>
          {t(sui.proceedToCheckout, lang)}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
        <Link href="/shop" className="mt-3 block text-center text-sm text-t-muted-fg hover:text-t-fg">
          {t(ui.continueShopping, lang)}
        </Link>
        <p className="mt-4 text-center text-xs text-t-muted-fg">{t(ui.cashOnDelivery, lang)}</p>
      </aside>
    </div>
  );
}
