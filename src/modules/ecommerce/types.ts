/**
 * Ecommerce module — shared, serialisable types used by server queries, actions and the storefront kit.
 * Nothing in here touches the database, so it is safe to import from client components.
 */
import type { Lang, LocalizedString } from "@/lib/i18n";
import type { TenantSettings } from "@/lib/tenant-settings";
import type { SiteContext } from "@/templates/types";

/* ---------- product data (DTOs produced by queries.ts) ---------- */

/** `{ Color: "Red", Size: "XL" }` */
export type VariantOptions = Record<string, string>;

export interface KeyValue {
  key: string;
  value: string;
}

/** Shape stored in `Product.attributes`: flat attributes plus an optional `specs` table. */
export interface ProductAttributes {
  specs?: Record<string, string>;
  [key: string]: string | Record<string, string> | undefined;
}

export interface VariantDTO {
  id: string;
  name: string;
  options: VariantOptions;
  price: number | null;
  sku: string | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: LocalizedString;
  imageUrl: string | null;
  parentId: string | null;
  productCount: number;
}

export interface ProductDTO {
  id: string;
  slug: string;
  name: LocalizedString;
  shortDesc: LocalizedString;
  description: LocalizedString;
  price: number;
  comparePrice: number | null;
  sku: string | null;
  stock: number;
  trackStock: boolean;
  images: string[];
  attributes: KeyValue[];
  specs: KeyValue[];
  tags: string[];
  isFeatured: boolean;
  requiresPrescription: boolean;
  genericName: string | null;
  manufacturer: string | null;
  dosageForm: string | null;
  strength: string | null;
  category: { id: string; slug: string; name: LocalizedString } | null;
  variants: VariantDTO[];
  seo: { title?: string; description?: string };
  createdAt: string;
}

export interface ShippingZoneDTO {
  id: string;
  name: string;
  cities: string[];
  fee: number;
  freeAbove: number | null;
  etaDays: string | null;
}

/* ---------- cart ---------- */

export interface CartItem {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  variantName?: string;
  imageUrl?: string;
  unitPrice: number;
  qty: number;
  requiresPrescription: boolean;
  /** hard cap for the quantity stepper (stock when tracked, otherwise 99) */
  maxQty: number;
}

export function cartKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return `${item.productId}:${item.variantId ?? ""}`;
}

/* ---------- orders ---------- */

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export interface TimelineEntry {
  status: string;
  at: string;
  note?: string;
}

export interface OrderItemDTO {
  id: string;
  name: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  total: number;
  slug?: string | null;
}

/** Public-safe order view (what the customer sees on /order/[number]). */
export interface OrderDTO {
  id: string;
  number: number;
  status: OrderStatusValue;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  giftMessage: string | null;
  hasPrescription: boolean;
  timeline: TimelineEntry[];
  items: OrderItemDTO[];
  createdAt: string;
}

/* ---------- serialisable slice of SiteContext for client components ---------- */

/**
 * `SiteContext` holds a Prisma `Tenant` (BigInt fields) and functions, so it cannot cross the
 * server → client boundary. Client components in this kit take a `StoreCtx` instead; server
 * components can build one with `toStoreCtx(ctx)`.
 */
export interface StoreCtx {
  host: string;
  lang: Lang;
  dir: "ltr" | "rtl";
  tenantName: string;
  categoryKey: string;
  modules: string[];
  commerce: TenantSettings["commerce"];
  contact: { phone: string; whatsapp: string };
  urduEnabled: boolean;
}

export function toStoreCtx(ctx: SiteContext): StoreCtx {
  return {
    host: ctx.host,
    lang: ctx.lang,
    dir: ctx.dir,
    tenantName: ctx.tenant.name,
    categoryKey: ctx.category.key,
    modules: ctx.category.modules,
    commerce: ctx.settings.commerce,
    contact: { phone: ctx.settings.contact.phone, whatsapp: ctx.settings.contact.whatsapp },
    urduEnabled: ctx.settings.languages.urduEnabled,
  };
}

/** Minimal ctx accepted by server-safe presentational components (satisfied by both SiteContext and StoreCtx). */
export type LangCtx = { lang: Lang };

/** Well-known Pakistani cities offered as suggestions in address forms and shipping zone editors. */
export const PK_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Sialkot",
  "Hyderabad",
  "Sukkur",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Mardan",
  "Sahiwal",
  "Okara",
  "Gujrat",
  "Jhelum",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Dera Ghazi Khan",
  "Mirpur (AJK)",
  "Muzaffarabad",
  "Gilgit",
  "Larkana",
  "Nawabshah",
  "Kasur",
  "Wah Cantt",
] as const;
