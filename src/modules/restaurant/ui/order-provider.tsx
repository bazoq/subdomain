"use client";

/**
 * Food-order cart state, persisted to localStorage under `sf_food:<host>` and read through
 * useSyncExternalStore (so every subscriber, tab and nested provider stays in sync).
 * Tolerant of nesting: an inner <OrderProvider> reuses the outer context.
 */
import * as React from "react";
import { cartLineKey, type CartLine, type CartLineInput, type OrderType } from "../types";

export const FOOD_CART_EVENT = "sf_food:change";
export const foodCartKey = (host: string) => `sf_food:${host}`;

interface PersistedState {
  lines: CartLine[];
  orderType: OrderType;
  zoneId: string | null;
}

export interface OrderContextValue extends PersistedState {
  host: string;
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (line: CartLineInput) => void;
  updateQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOrderType: (type: OrderType) => void;
  setZoneId: (zoneId: string | null) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const OrderContext = React.createContext<OrderContextValue | null>(null);

const EMPTY: Record<OrderType, PersistedState> = {
  DELIVERY: { lines: [], orderType: "DELIVERY", zoneId: null },
  PICKUP: { lines: [], orderType: "PICKUP", zoneId: null },
  DINE_IN: { lines: [], orderType: "DINE_IN", zoneId: null },
};

const MAX_QTY = 99;
const MAX_LINES = 50;

const optStr = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

/**
 * Validate + clamp one persisted line. localStorage is user-editable, so quantities are forced into 1..99 (the server
 * accepts at most 50 per line and re-prices everything anyway) and malformed lines are dropped.
 */
function sanitizeLine(x: unknown): CartLine | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (typeof o.menuItemId !== "string" || !o.menuItemId || typeof o.name !== "string" || !o.name) return null;
  if (typeof o.unitPrice !== "number" || !Number.isFinite(o.unitPrice) || o.unitPrice < 0) return null;
  const qtyRaw = typeof o.qty === "number" && Number.isFinite(o.qty) ? Math.floor(o.qty) : 0;
  if (qtyRaw < 1) return null;
  const modifiers = Array.isArray(o.modifiers)
    ? o.modifiers
        .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
        .map((m) => ({ id: String(m.id ?? ""), name: String(m.name ?? ""), price: typeof m.price === "number" && Number.isFinite(m.price) ? Math.max(0, Math.floor(m.price)) : 0 }))
        .filter((m) => m.id)
    : [];
  const base = {
    menuItemId: o.menuItemId,
    slug: typeof o.slug === "string" ? o.slug : "",
    name: o.name,
    sizeName: optStr(o.sizeName),
    unitPrice: Math.floor(o.unitPrice),
    modifiers,
    qty: Math.min(MAX_QTY, qtyRaw),
    note: optStr(o.note),
    imageUrl: optStr(o.imageUrl),
  };
  return { ...base, key: cartLineKey(base) };
}

function parseState(raw: string, fallback: PersistedState): PersistedState {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const byKey = new Map<string, CartLine>();
    if (Array.isArray(parsed.lines)) {
      for (const entry of parsed.lines) {
        const line = sanitizeLine(entry);
        if (!line) continue;
        const existing = byKey.get(line.key);
        byKey.set(line.key, existing ? { ...existing, qty: Math.min(MAX_QTY, existing.qty + line.qty) } : line);
        if (byKey.size >= MAX_LINES) break;
      }
    }
    const orderType: OrderType = parsed.orderType === "PICKUP" || parsed.orderType === "DINE_IN" || parsed.orderType === "DELIVERY" ? parsed.orderType : fallback.orderType;
    return { lines: Array.from(byKey.values()), orderType, zoneId: typeof parsed.zoneId === "string" ? parsed.zoneId : null };
  } catch {
    return fallback;
  }
}

/* snapshot cache so getSnapshot returns a referentially stable object per raw value */
const snapshots = new Map<string, { raw: string | null; state: PersistedState }>();

function readSnapshot(host: string, fallback: PersistedState): PersistedState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(foodCartKey(host));
  } catch {
    raw = null;
  }
  const cached = snapshots.get(host);
  if (cached && cached.raw === raw) return cached.state;
  const state = raw ? parseState(raw, fallback) : fallback;
  snapshots.set(host, { raw, state });
  return state;
}

function writeState(host: string, state: PersistedState) {
  try {
    window.localStorage.setItem(foodCartKey(host), JSON.stringify(state));
  } catch {
    /* quota / private mode: keep in-memory snapshot only */
    snapshots.set(host, { raw: null, state });
  }
  const count = state.lines.reduce((n, l) => n + l.qty, 0);
  window.dispatchEvent(new CustomEvent(FOOD_CART_EVENT, { detail: { host, count } }));
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

export function OrderProvider({ host, defaultOrderType, children }: { host: string; defaultOrderType?: OrderType; children: React.ReactNode }) {
  const parent = React.useContext(OrderContext);
  if (parent) return <>{children}</>;
  return (
    <OrderProviderInner host={host} defaultOrderType={defaultOrderType ?? "DELIVERY"}>
      {children}
    </OrderProviderInner>
  );
}

function OrderProviderInner({ host, defaultOrderType, children }: { host: string; defaultOrderType: OrderType; children: React.ReactNode }) {
  const fallback = EMPTY[defaultOrderType];
  const sub = React.useCallback((cb: () => void) => subscribe(host, cb), [host]);
  const state = React.useSyncExternalStore(
    sub,
    () => readSnapshot(host, fallback),
    () => fallback,
  );
  const hydrated = React.useSyncExternalStore(
    sub,
    () => true,
    () => false,
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const commit = React.useCallback(
    (updater: (s: PersistedState) => PersistedState) => {
      const current = readSnapshot(host, fallback);
      writeState(host, updater(current));
    },
    [host, fallback],
  );

  const add = React.useCallback(
    (input: CartLineInput) => {
      const key = cartLineKey(input);
      commit((s) => {
        const idx = s.lines.findIndex((l) => l.key === key);
        const add = Math.max(1, Math.floor(Number.isFinite(input.qty) ? input.qty : 1));
        if (idx >= 0) {
          const lines = [...s.lines];
          lines[idx] = { ...lines[idx], qty: Math.min(MAX_QTY, lines[idx].qty + add) };
          return { ...s, lines };
        }
        if (s.lines.length >= MAX_LINES) return s;
        return { ...s, lines: [...s.lines, { ...input, key, qty: Math.min(MAX_QTY, add) }] };
      });
    },
    [commit],
  );

  const updateQty = React.useCallback(
    (key: string, qty: number) => {
      const q = Math.floor(Number.isFinite(qty) ? qty : 0);
      commit((s) => ({
        ...s,
        lines: q <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, q) } : l)),
      }));
    },
    [commit],
  );

  const remove = React.useCallback((key: string) => commit((s) => ({ ...s, lines: s.lines.filter((l) => l.key !== key) })), [commit]);
  const clear = React.useCallback(() => commit((s) => ({ ...s, lines: [] })), [commit]);
  const setOrderType = React.useCallback((orderType: OrderType) => commit((s) => ({ ...s, orderType })), [commit]);
  const setZoneId = React.useCallback((zoneId: string | null) => commit((s) => ({ ...s, zoneId })), [commit]);
  const openDrawer = React.useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = React.useCallback(() => setDrawerOpen(false), []);

  const count = state.lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = state.lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);

  const value = React.useMemo<OrderContextValue>(
    () => ({ ...state, host, hydrated, count, subtotal, add, updateQty, remove, clear, setOrderType, setZoneId, drawerOpen, openDrawer, closeDrawer }),
    [state, host, hydrated, count, subtotal, add, updateQty, remove, clear, setOrderType, setZoneId, drawerOpen, openDrawer, closeDrawer],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

/** Cart context; throws outside <OrderProvider>. */
export function useOrder(): OrderContextValue {
  const ctx = React.useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used inside <OrderProvider>");
  return ctx;
}

/** Cart context or null when rendered outside a provider (e.g. cards on the home page). */
export function useOrderOptional(): OrderContextValue | null {
  return React.useContext(OrderContext);
}
