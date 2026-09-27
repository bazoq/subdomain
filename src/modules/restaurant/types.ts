/**
 * Client-safe types and constants shared by the restaurant module
 * (storefront UI, admin components, server actions).
 * No server imports here.
 */
import { z } from "zod";
import type { Lang, LocalizedString } from "@/lib/i18n";
import type { CategoryKey } from "@/lib/categories";
import type { OpeningHours, TenantSettings } from "@/lib/tenant-settings";
import type { SiteContext } from "@/templates/types";

/* ---------- constants ---------- */

export const FOOD_ORDER_STATUSES = ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"] as const;
export type FoodOrderStatusKey = (typeof FOOD_ORDER_STATUSES)[number];

export const ACTIVE_FOOD_STATUSES: FoodOrderStatusKey[] = ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];

export const FOOD_ORDER_TYPES = ["DELIVERY", "PICKUP", "DINE_IN"] as const;
export type OrderType = (typeof FOOD_ORDER_TYPES)[number];

export const RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "SEATED", "CANCELLED"] as const;
export type ReservationStatusKey = (typeof RESERVATION_STATUSES)[number];

/** Allowed reservation transitions. SEATED and CANCELLED are final (a no-show / change of plan is a new request). */
export const RESERVATION_TRANSITIONS: Record<ReservationStatusKey, ReservationStatusKey[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SEATED", "CANCELLED"],
  SEATED: [],
  CANCELLED: [],
};

export function canTransitionReservation(from: string, to: ReservationStatusKey): boolean {
  const allowed = RESERVATION_TRANSITIONS[from as ReservationStatusKey];
  return !!allowed && allowed.includes(to);
}

/** Result of a successful `placeFoodOrder` call. */
export interface PlacedFoodOrder {
  number: number;
  /** access token for /menu/order/[number]?t=… (non-guessable); empty when the submission was a bot */
  token: string;
  /** kept for older templates that build the tracking URL themselves */
  phoneLast4: string;
}

export const MENU_TAGS = ["spicy", "veg", "bestseller", "new"] as const;
export type MenuTag = (typeof MENU_TAGS)[number];

/** Allowed status transitions on the kitchen board / order detail. */
export const STATUS_TRANSITIONS: Record<FoodOrderStatusKey, FoodOrderStatusKey[]> = {
  NEW: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/** The "happy path" next status for a given order (used by the one-click advance button). */
export function nextStatusFor(status: FoodOrderStatusKey, type: OrderType): FoodOrderStatusKey | null {
  switch (status) {
    case "NEW":
      return "ACCEPTED";
    case "ACCEPTED":
      return "PREPARING";
    case "PREPARING":
      return "READY";
    case "READY":
      return type === "DELIVERY" ? "OUT_FOR_DELIVERY" : "COMPLETED";
    case "OUT_FOR_DELIVERY":
      return "COMPLETED";
    default:
      return null;
  }
}

/* ---------- JSON column shapes ---------- */

export const menuSizeSchema = z.object({
  name: z.string().trim().min(1).max(40),
  price: z.coerce.number().int().min(0),
});
export type MenuSize = z.infer<typeof menuSizeSchema>;
export const menuSizesSchema = z.array(menuSizeSchema).max(8);

export interface TimelineEntry {
  status: FoodOrderStatusKey;
  at: string; // ISO
  note?: string;
}

export interface OrderItemModifier {
  name: string;
  price: number;
}

/* ---------- storefront DTOs (serialisable; safe to hand to client components) ---------- */

export interface MenuModifierDto {
  id: string;
  name: LocalizedString;
  price: number;
}

export interface MenuModifierGroupDto {
  id: string;
  name: LocalizedString;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  modifiers: MenuModifierDto[];
}

export interface MenuItemDto {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  sizes: MenuSize[];
  imageUrl: string | null;
  tags: string[];
  isFeatured: boolean;
  categoryId: string | null;
  modifierGroups: MenuModifierGroupDto[];
}

export interface MenuCategoryDto {
  id: string;
  slug: string;
  name: LocalizedString;
  imageUrl: string | null;
  items: MenuItemDto[];
}

export interface DeliveryZoneDto {
  id: string;
  name: string;
  fee: number;
  minOrder: number;
  etaMins: number | null;
}

/** Lowest price an item can be ordered at (min of sizes, else base price). */
export function itemStartingPrice(item: Pick<MenuItemDto, "price" | "sizes">): number {
  if (item.sizes.length) return Math.min(...item.sizes.map((s) => s.price));
  return item.price;
}

/* ---------- cart ---------- */

export interface CartModifier {
  id: string;
  name: string;
  price: number;
}

export interface CartLine {
  /** stable key derived from item + size + modifiers + note */
  key: string;
  menuItemId: string;
  slug: string;
  name: string;
  sizeName?: string;
  unitPrice: number;
  modifiers: CartModifier[];
  qty: number;
  note?: string;
  imageUrl?: string;
}

export type CartLineInput = Omit<CartLine, "key">;

export function cartLineKey(line: CartLineInput): string {
  const mods = [...line.modifiers.map((m) => m.id)].sort().join(",");
  return [line.menuItemId, line.sizeName ?? "", mods, (line.note ?? "").trim()].join("|");
}

/* ---------- serialisable site context for client components ---------- */

/**
 * `SiteContext` contains non-serialisable values (Prisma BigInt, functions), so client
 * components receive this reduced, serialisable subset instead. Build it with `toRestaurantCtx(ctx)`.
 */
export interface RestaurantCtx {
  host: string;
  lang: Lang;
  dir: "ltr" | "rtl";
  tenantName: string;
  categoryKey: CategoryKey;
  phone: string;
  whatsapp: string;
  restaurant: TenantSettings["restaurant"];
  hours: OpeningHours;
}

export function toRestaurantCtx(ctx: SiteContext): RestaurantCtx {
  return {
    host: ctx.host,
    lang: ctx.lang,
    dir: ctx.dir,
    tenantName: ctx.tenant.name,
    categoryKey: ctx.category.key,
    phone: ctx.settings.contact.phone,
    whatsapp: ctx.settings.contact.whatsapp,
    restaurant: ctx.settings.restaurant,
    hours: ctx.settings.hours,
  };
}

/* ---------- admin / live board DTOs ---------- */

export interface FoodOrderItemDto {
  id: string;
  name: string;
  sizeName: string | null;
  modifiers: OrderItemModifier[];
  unitPrice: number;
  quantity: number;
  total: number;
  note: string | null;
}

export interface FoodOrderDto {
  id: string;
  number: number;
  type: OrderType;
  status: FoodOrderStatusKey;
  customerName: string;
  customerPhone: string;
  address: string | null;
  area: string | null;
  tableNumber: string | null;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  scheduledFor: string | null;
  estimatedMins: number | null;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
  items: FoodOrderItemDto[];
}

/* ---------- helpers ---------- */

export function parseTimeline(raw: unknown): TimelineEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: TimelineEntry[] = [];
  for (const e of raw) {
    if (e && typeof e === "object" && "status" in e && "at" in e) {
      const r = e as { status: string; at: string; note?: string };
      if ((FOOD_ORDER_STATUSES as readonly string[]).includes(r.status)) out.push({ status: r.status as FoodOrderStatusKey, at: String(r.at), note: r.note });
    }
  }
  return out;
}

export function parseItemModifiers(raw: unknown): OrderItemModifier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is { name: string; price: number } => !!m && typeof m === "object" && "name" in m)
    .map((m) => ({ name: String(m.name), price: Number(m.price) || 0 }));
}

export function parseSizes(raw: unknown): MenuSize[] {
  const r = menuSizesSchema.safeParse(raw ?? []);
  return r.success ? r.data : [];
}

export function orderTypeLabel(type: OrderType, lang: Lang): string {
  const m: Record<OrderType, LocalizedString> = {
    DELIVERY: { en: "Delivery", ur: "ڈیلیوری" },
    PICKUP: { en: "Pickup", ur: "پک اپ" },
    DINE_IN: { en: "Dine-in", ur: "ڈائن ان" },
  };
  const v = m[type];
  return lang === "ur" && v.ur ? v.ur : v.en;
}

export function statusLabel(status: FoodOrderStatusKey, lang: Lang): string {
  const m: Record<FoodOrderStatusKey, LocalizedString> = {
    NEW: { en: "Received", ur: "موصول" },
    ACCEPTED: { en: "Accepted", ur: "منظور" },
    PREPARING: { en: "Preparing", ur: "تیار ہو رہا ہے" },
    READY: { en: "Ready", ur: "تیار" },
    OUT_FOR_DELIVERY: { en: "Out for delivery", ur: "ڈیلیوری کے لیے روانہ" },
    COMPLETED: { en: "Completed", ur: "مکمل" },
    CANCELLED: { en: "Cancelled", ur: "منسوخ" },
  };
  const v = m[status];
  return lang === "ur" && v.ur ? v.ur : v.en;
}
