"use client";

/**
 * Cart state for the storefront. Persisted in localStorage under `sf_cart:<host>` and exposed via
 * `useCart()`. The provider is tolerant: nesting a second provider (template + page) reuses the outer one,
 * and `useCart()` outside any provider returns an inert cart so headers never crash.
 */
import * as React from "react";
import { cartKey, type CartItem, type StoreCtx } from "../types";

const MAX_LINES = 50;
const EMPTY: CartItem[] = [];

function isCartItem(x: unknown): x is CartItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.productId === "string" && typeof o.slug === "string" && typeof o.name === "string" && typeof o.unitPrice === "number" && typeof o.qty === "number";
}

class CartStore {
  private items: CartItem[] = EMPTY;
  private loaded = false;
  private listeners = new Set<() => void>();
  constructor(private readonly key: string) {}

  private load() {
    if (this.loaded || typeof window === "undefined") return;
    this.loaded = true;
    try {
      const raw = window.localStorage.getItem(this.key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) this.items = parsed.filter(isCartItem).slice(0, MAX_LINES);
      }
    } catch {
      this.items = EMPTY;
    }
  }
  private emit() {
    for (const l of this.listeners) l();
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== this.key) return;
      this.loaded = false;
      this.load();
      this.emit();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      this.listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  };
  getSnapshot = () => {
    this.load();
    return this.items;
  };
  getServerSnapshot = () => EMPTY;
  set(next: CartItem[]) {
    this.items = next.slice(0, MAX_LINES);
    try {
      window.localStorage.setItem(this.key, JSON.stringify(this.items));
    } catch {
      /* storage may be unavailable (private mode); keep in-memory state */
    }
    this.emit();
  }
}

const stores = new Map<string, CartStore>();
function storeFor(host: string) {
  const key = `sf_cart:${host}`;
  let s = stores.get(key);
  if (!s) {
    s = new CartStore(key);
    stores.set(key, s);
  }
  return s;
}

export interface CartApi {
  items: CartItem[];
  count: number;
  subtotal: number;
  /** false during SSR / hydration, true once localStorage has been read */
  hydrated: boolean;
  requiresPrescription: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  update: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** serialisable site context when the provider was given one (via EcommerceProviders) */
  store: StoreCtx | null;
  host: string;
}

const noop = () => undefined;
const INERT: CartApi = {
  items: EMPTY,
  count: 0,
  subtotal: 0,
  hydrated: false,
  requiresPrescription: false,
  add: noop,
  update: noop,
  remove: noop,
  clear: noop,
  isOpen: false,
  openDrawer: noop,
  closeDrawer: noop,
  store: null,
  host: "",
};

const CartContext = React.createContext<CartApi | null>(null);

const subscribeNever = () => noop;

export function CartProvider({ host, store = null, children }: { host: string; store?: StoreCtx | null; children: React.ReactNode }) {
  const parent = React.useContext(CartContext);
  if (parent) return <>{children}</>;
  return (
    <CartProviderInner host={host} store={store}>
      {children}
    </CartProviderInner>
  );
}

function CartProviderInner({ host, store, children }: { host: string; store: StoreCtx | null; children: React.ReactNode }) {
  const cartStore = React.useMemo(() => storeFor(host), [host]);
  const items = React.useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const hydrated = React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const [isOpen, setOpen] = React.useState(false);

  const api = React.useMemo<CartApi>(() => {
    const clampQty = (item: Pick<CartItem, "maxQty">, qty: number) => Math.max(1, Math.min(item.maxQty > 0 ? item.maxQty : 99, Math.floor(qty)));
    return {
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.unitPrice * i.qty, 0),
      hydrated,
      requiresPrescription: items.some((i) => i.requiresPrescription),
      add: (item, qty = 1) => {
        const key = cartKey(item);
        const current = cartStore.getSnapshot();
        const existing = current.find((i) => cartKey(i) === key);
        if (existing) {
          cartStore.set(current.map((i) => (cartKey(i) === key ? { ...i, ...item, qty: clampQty(item, i.qty + qty) } : i)));
        } else {
          cartStore.set([...current, { ...item, qty: clampQty(item, qty) }]);
        }
      },
      update: (key, qty) => {
        const current = cartStore.getSnapshot();
        if (qty <= 0) cartStore.set(current.filter((i) => cartKey(i) !== key));
        else cartStore.set(current.map((i) => (cartKey(i) === key ? { ...i, qty: clampQty(i, qty) } : i)));
      },
      remove: (key) => cartStore.set(cartStore.getSnapshot().filter((i) => cartKey(i) !== key)),
      clear: () => cartStore.set([]),
      isOpen,
      openDrawer: () => setOpen(true),
      closeDrawer: () => setOpen(false),
      store,
      host,
    };
  }, [items, hydrated, isOpen, cartStore, store, host]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

/** Cart API; returns an inert cart when rendered outside a CartProvider. */
export function useCart(): CartApi {
  return React.useContext(CartContext) ?? INERT;
}

/** null when no provider is mounted. */
export function useCartOptional(): CartApi | null {
  return React.useContext(CartContext);
}

/** Lightweight hook for header badges: number of units in the cart (0 until hydrated). */
export function useCartCount(): number {
  const cart = React.useContext(CartContext);
  return cart?.hydrated ? cart.count : 0;
}

/** Alias kept for templates that prefer the `CartCount` name. */
export const CartCount = useCartCount;
