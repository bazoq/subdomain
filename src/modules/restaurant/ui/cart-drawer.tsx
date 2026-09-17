"use client";

/** Slide-over listing cart lines with quantity controls and a link to checkout. */
import * as React from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { rs } from "../strings";
import type { RestaurantCtx } from "../types";
import { useOrder } from "./order-provider";

export function CartDrawer({ ctx }: { ctx: RestaurantCtx }) {
  const { lines, count, subtotal, updateQty, remove, clear, drawerOpen, closeDrawer } = useOrder();
  const lang = ctx.lang;

  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t(rs.yourOrder, lang)} dir={ctx.dir}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDrawer} />
      <aside className={cn("absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-t-card text-t-fg shadow-2xl")}>
        <header className="flex items-center justify-between border-b border-t-border px-5 py-4">
          <h2 className="font-heading flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="size-5" />
            {t(rs.yourOrder, lang)}
            {count ? <span className="rounded-full bg-t-muted px-2 py-0.5 text-xs font-semibold text-t-muted-fg">{count}</span> : null}
          </h2>
          <button type="button" onClick={closeDrawer} aria-label="Close" className="rounded-full p-1.5 hover:bg-t-muted">
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-t-muted-fg">
              <ShoppingBag className="size-10 opacity-30" />
              <p>{t(rs.emptyOrder, lang)}</p>
              <button type="button" onClick={closeDrawer} className="t-btn t-btn-outline text-sm">
                {t(rs.browseMenu, lang)}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-t-border">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3 py-3">
                  {l.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imageUrl} alt="" className="size-16 shrink-0 rounded-[var(--t-radius)] object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">
                      {l.name}
                      {l.sizeName ? <span className="text-t-muted-fg"> · {l.sizeName}</span> : null}
                    </p>
                    {l.modifiers.length ? <p className="mt-0.5 text-xs text-t-muted-fg">{l.modifiers.map((m) => m.name).join(", ")}</p> : null}
                    {l.note ? <p className="mt-0.5 text-xs italic text-t-muted-fg">“{l.note}”</p> : null}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-[var(--t-radius)] border border-t-border">
                        <button type="button" onClick={() => updateQty(l.key, l.qty - 1)} className="flex size-8 items-center justify-center hover:bg-t-muted" aria-label="Decrease">
                          {l.qty === 1 ? <Trash2 className="size-3.5 text-red-600" /> : <Minus className="size-3.5" />}
                        </button>
                        <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                        <button type="button" onClick={() => updateQty(l.key, l.qty + 1)} className="flex size-8 items-center justify-center hover:bg-t-muted" aria-label="Increase">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{formatPKR(l.unitPrice * l.qty)}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(l.key)} className="self-start text-t-muted-fg hover:text-red-600" aria-label={t(ui.remove, lang)}>
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length ? (
          <footer className="space-y-3 border-t border-t-border px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-t-muted-fg">{t(ui.subtotal, lang)}</span>
              <span className="text-lg font-bold tabular-nums">{formatPKR(subtotal)}</span>
            </div>
            <a href="/menu/checkout" className="t-btn t-btn-primary h-11 w-full text-sm">
              {t(rs.proceedToCheckout, lang)}
            </a>
            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={closeDrawer} className="underline-offset-2 hover:underline">
                {t(rs.addMore, lang)}
              </button>
              <button type="button" onClick={clear} className="text-t-muted-fg underline-offset-2 hover:text-red-600 hover:underline">
                {t(rs.clearOrder, lang)}
              </button>
            </div>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
