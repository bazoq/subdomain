/**
 * Pure pricing helpers shared by the checkout form (client, for the live estimate) and
 * `placeOrder` (server, authoritative). Keep them free of imports that are server-only.
 */
import type { TenantSettings } from "@/lib/tenant-settings";
import type { ProductDTO, ShippingZoneDTO, VariantDTO } from "./types";

export function normalizeCity(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface ShippingQuote {
  fee: number;
  zone: ShippingZoneDTO | null;
  free: boolean;
  /** "2-3" days when the matched zone provides one */
  etaDays: string | null;
}

/**
 * Resolve the shipping fee for a city:
 *  1. active zone whose `cities` (or name) matches the city, case-insensitive → zone fee / free above
 *  2. otherwise `settings.commerce.defaultShippingFee`
 *  3. `settings.commerce.freeShippingAbove` (store-wide) always wins when the subtotal reaches it
 */
export function computeShipping(input: { zones: ShippingZoneDTO[]; city: string; subtotal: number; commerce: TenantSettings["commerce"] }): ShippingQuote {
  const city = normalizeCity(input.city);
  const zone =
    input.zones.find((z) => z.cities.some((c) => normalizeCity(c) === city)) ?? input.zones.find((z) => normalizeCity(z.name) === city) ?? null;
  const storeFree = input.commerce.freeShippingAbove != null && input.commerce.freeShippingAbove > 0 && input.subtotal >= input.commerce.freeShippingAbove;
  if (zone) {
    const zoneFree = zone.freeAbove != null && zone.freeAbove > 0 && input.subtotal >= zone.freeAbove;
    const free = storeFree || zoneFree;
    return { fee: free ? 0 : zone.fee, zone, free, etaDays: zone.etaDays };
  }
  return { fee: storeFree ? 0 : input.commerce.defaultShippingFee, zone: null, free: storeFree, etaDays: null };
}

export type CouponLike = { type: string; value: number };

/** Discount in rupees (never more than the subtotal). */
export function couponDiscount(coupon: CouponLike, subtotal: number): number {
  const raw = coupon.type === "PERCENT" ? Math.round((subtotal * Math.min(coupon.value, 100)) / 100) : coupon.value;
  return Math.max(0, Math.min(subtotal, raw));
}

export function orderLabel(prefix: string, number: number): string {
  return `${prefix || "ORD"}-${number}`;
}

export function phoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

/** Price a customer pays for a product / variant combination. */
export function effectivePrice(product: Pick<ProductDTO, "price">, variant?: Pick<VariantDTO, "price"> | null): number {
  return variant?.price ?? product.price;
}

/** Units available for a product / variant, `Infinity` when stock is not tracked. */
export function availableStock(product: Pick<ProductDTO, "trackStock" | "stock" | "variants">, variant?: Pick<VariantDTO, "stock"> | null): number {
  if (!product.trackStock) return Number.POSITIVE_INFINITY;
  if (variant) return Math.max(0, variant.stock);
  if (product.variants.length) return product.variants.reduce((n, v) => n + Math.max(0, v.stock), 0);
  return Math.max(0, product.stock);
}

export function isInStock(product: Pick<ProductDTO, "trackStock" | "stock" | "variants">): boolean {
  return availableStock(product) > 0;
}

/** Lowest price across variants (for "from Rs X" on cards). */
export function minPrice(product: Pick<ProductDTO, "price" | "variants">): number {
  const prices = product.variants.filter((v) => v.isActive && v.price != null).map((v) => v.price as number);
  return prices.length ? Math.min(product.price, ...prices) : product.price;
}

export function salePercent(price: number, comparePrice: number | null): number | null {
  if (!comparePrice || comparePrice <= price) return null;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

/** Cap for the quantity stepper. */
export function maxQtyFor(product: Pick<ProductDTO, "trackStock" | "stock" | "variants">, variant?: Pick<VariantDTO, "stock"> | null): number {
  const avail = availableStock(product, variant);
  return Number.isFinite(avail) ? Math.min(99, avail) : 99;
}
