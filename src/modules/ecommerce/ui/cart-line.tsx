"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Img } from "@/templates/ui";
import { t, ui, type Lang } from "@/lib/i18n";
import { cn, formatPKR } from "@/lib/utils";
import { cartKey, type CartItem } from "../types";
import { useCart } from "./cart-provider";
import { sui } from "./strings";

/** One cart row with quantity stepper and remove — shared by the cart page and drawer. */
export function CartLine({ item, lang, compact = false, className }: { item: CartItem; lang: Lang; compact?: boolean; className?: string }) {
  const cart = useCart();
  const key = cartKey(item);
  return (
    <div className={cn("flex gap-3 py-4", className)}>
      <Link href={`/shop/${item.slug}`} className="shrink-0 overflow-hidden rounded-[var(--t-radius)] bg-t-muted">
        <Img src={item.imageUrl} alt={item.name} className={cn("object-cover", compact ? "size-16" : "size-20 sm:size-24")} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/shop/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-t-primary">
              {item.name}
            </Link>
            {item.variantName ? <p className="text-xs text-t-muted-fg">{item.variantName}</p> : null}
            {item.requiresPrescription ? <p className="text-xs font-medium text-sky-700">{t(ui.prescriptionRequired, lang)}</p> : null}
          </div>
          <button type="button" onClick={() => cart.remove(key)} aria-label={`${t(ui.remove, lang)} ${item.name}`} className="rounded p-1 text-t-muted-fg hover:bg-t-muted hover:text-red-600">
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="inline-flex h-9 items-center rounded-[var(--t-radius)] border border-t-border" role="group" aria-label={t(ui.quantity, lang)}>
            <button type="button" onClick={() => cart.update(key, item.qty - 1)} className="flex h-full w-9 items-center justify-center" aria-label="Decrease quantity">
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => cart.update(key, item.qty + 1)}
              disabled={item.qty >= item.maxQty}
              className="flex h-full w-9 items-center justify-center disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{formatPKR(item.unitPrice * item.qty)}</p>
            {item.qty > 1 ? (
              <p className="text-xs text-t-muted-fg">
                {formatPKR(item.unitPrice)} {t(sui.each, lang)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
