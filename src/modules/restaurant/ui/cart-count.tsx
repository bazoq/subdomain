"use client";

/**
 * Lightweight cart-count hook for template headers. Works with or without <OrderProvider>:
 * subscribes to localStorage + cart change events via useSyncExternalStore.
 */
import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOOD_CART_EVENT, foodCartKey } from "./order-provider";

const cache = new Map<string, { raw: string | null; count: number }>();

function readCount(host: string): number {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(foodCartKey(host));
  } catch {
    raw = null;
  }
  const c = cache.get(host);
  if (c && c.raw === raw) return c.count;
  let count = 0;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { lines?: { qty?: number }[] };
      count = (parsed.lines ?? []).reduce((n, l) => n + (typeof l.qty === "number" ? l.qty : 0), 0);
    } catch {
      count = 0;
    }
  }
  cache.set(host, { raw, count });
  return count;
}

function subscribe(host: string, cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === foodCartKey(host)) cb();
  };
  window.addEventListener(FOOD_CART_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(FOOD_CART_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCartCount(host: string): number {
  const sub = React.useCallback((cb: () => void) => subscribe(host, cb), [host]);
  return React.useSyncExternalStore(
    sub,
    () => readCount(host),
    () => 0,
  );
}

/** Header link to checkout with a count bubble. */
export function CartCountLink({ host, className, label }: { host: string; className?: string; label?: string }) {
  const count = useCartCount(host);
  return (
    <a href="/menu/checkout" className={cn("relative inline-flex items-center gap-2", className)} aria-label={label ?? "Your order"}>
      <ShoppingBag className="size-5" />
      {label ? <span>{label}</span> : null}
      {count > 0 ? (
        <span className="absolute -end-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-t-primary px-1 text-[10px] font-bold leading-5 text-t-primary-fg">{count}</span>
      ) : null}
    </a>
  );
}
