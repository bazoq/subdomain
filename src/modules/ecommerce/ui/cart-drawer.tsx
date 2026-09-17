"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { cartKey, type LangCtx } from "../types";
import { CartLine } from "./cart-line";
import { useCart } from "./cart-provider";
import { sui } from "./strings";

/**
 * Optional slide-over cart. Mount once inside the provider (e.g. in a template layout) and open it with
 * `<CartButton mode="drawer" />` or `useCart().openDrawer()`.
 */
export function CartDrawer({ ctx }: { ctx?: LangCtx }) {
  const cart = useCart();
  const lang = ctx?.lang ?? cart.store?.lang ?? "en";
  const { isOpen, closeDrawer } = cart;

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t(sui.cartTitle, lang)}>
      <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
      <aside className={cn("absolute inset-y-0 flex w-full max-w-md flex-col bg-t-bg text-t-fg shadow-2xl", "right-0 rtl:left-0 rtl:right-auto")}>
        <header className="flex items-center justify-between border-b border-t-border px-5 py-4">
          <h2 className="font-heading text-lg font-semibold">
            {t(sui.cartTitle, lang)} <span className="text-sm font-normal text-t-muted-fg">({cart.count})</span>
          </h2>
          <button type="button" onClick={closeDrawer} aria-label="Close" className="rounded-full p-1.5 hover:bg-t-muted">
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 divide-y divide-t-border overflow-y-auto px-5">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-t-muted-fg">
              <ShoppingBag className="size-10" />
              <p>{t(ui.emptyCart, lang)}</p>
              <Link href="/shop" onClick={closeDrawer} className="t-btn t-btn-primary">
                {t(ui.continueShopping, lang)}
              </Link>
            </div>
          ) : (
            cart.items.map((item) => <CartLine key={cartKey(item)} item={item} lang={lang} compact />)
          )}
        </div>
        {cart.items.length ? (
          <footer className="border-t border-t-border px-5 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-t-muted-fg">{t(ui.subtotal, lang)}</span>
              <span className="font-bold">{formatPKR(cart.subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-t-muted-fg">{t(sui.shippingAtCheckout, lang)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={closeDrawer} className="t-btn t-btn-outline">
                {t(sui.viewCart, lang)}
              </Link>
              <Link href="/checkout" onClick={closeDrawer} className="t-btn t-btn-primary">
                {t(ui.checkout, lang)}
              </Link>
            </div>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
