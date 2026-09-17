"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { t, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LangCtx } from "../types";
import { useCart } from "./cart-provider";

/**
 * Header cart icon with a count badge. Links to /cart by default; `mode="drawer"` opens the CartDrawer
 * instead (mount `<CartDrawer />` somewhere inside the provider). Safe to render without a provider.
 */
export function CartButton({ ctx, mode = "link", showLabel = false, className }: { ctx?: LangCtx; mode?: "link" | "drawer"; showLabel?: boolean; className?: string }) {
  const cart = useCart();
  const lang = ctx?.lang ?? cart.store?.lang ?? "en";
  const count = cart.hydrated ? cart.count : 0;
  const label = t(ui.cart, lang);
  const inner = (
    <>
      <ShoppingBag className="size-5" aria-hidden="true" />
      {showLabel ? <span className="text-sm font-medium">{label}</span> : null}
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-t-accent px-1 text-[11px] font-bold leading-none text-t-accent-fg rtl:-left-1.5 rtl:right-auto">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </>
  );
  const cls = cn("relative inline-flex items-center gap-2 rounded-full p-2 transition hover:bg-t-muted", className);
  if (mode === "drawer") {
    return (
      <button type="button" onClick={cart.openDrawer} className={cls} aria-label={`${label} (${count})`}>
        {inner}
      </button>
    );
  }
  return (
    <Link href="/cart" className={cls} aria-label={`${label} (${count})`}>
      {inner}
    </Link>
  );
}
