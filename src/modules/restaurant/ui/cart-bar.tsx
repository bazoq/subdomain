"use client";

/** Sticky bottom bar (count + total + "View order"). Hidden while the order is empty. */
import { ShoppingBag } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { rs } from "../strings";
import type { RestaurantCtx } from "../types";
import { useOrder } from "./order-provider";

export function CartBar({ ctx, className }: { ctx: RestaurantCtx; className?: string }) {
  const { count, subtotal, hydrated, openDrawer, drawerOpen } = useOrder();
  if (!hydrated || count === 0 || drawerOpen) return null;
  const lang = ctx.lang;
  return (
    <div className={cn("pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:pb-6", className)} dir={ctx.dir}>
      <button
        type="button"
        onClick={openDrawer}
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-t-primary px-5 py-3 text-t-primary-fg shadow-2xl transition hover:brightness-110"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{count}</span>
          {count === 1 ? t(rs.item, lang) : t(rs.items, lang)}
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {t(rs.viewOrder, lang)}
          <ShoppingBag className="size-4" />
        </span>
        <span className="text-sm font-bold tabular-nums">{formatPKR(subtotal)}</span>
      </button>
    </div>
  );
}
