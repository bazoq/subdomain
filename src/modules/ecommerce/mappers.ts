/**
 * Prisma row → serialisable DTO mappers. Used by queries.ts (public) and actions.ts / admin pages.
 * No "server-only" import so admin client components may reuse the pure helpers (`parseAttributes` …).
 */
import type { LocalizedString } from "@/lib/i18n";
import type { Order, OrderItem, Product, ProductCategory, ProductVariant, ShippingZone } from "@/generated/prisma/client";
import type { CategoryDTO, KeyValue, OrderDTO, OrderStatusValue, ProductAttributes, ProductDTO, ShippingZoneDTO, TimelineEntry, VariantDTO, VariantOptions } from "./types";

export function asLocalized(raw: unknown): LocalizedString {
  if (raw && typeof raw === "object" && "en" in raw) {
    const o = raw as { en?: unknown; ur?: unknown };
    return { en: typeof o.en === "string" ? o.en : "", ...(typeof o.ur === "string" && o.ur ? { ur: o.ur } : {}) };
  }
  if (typeof raw === "string") return { en: raw };
  return { en: "" };
}

export function asOptions(raw: unknown): VariantOptions {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: VariantOptions = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (typeof v === "string") out[k] = v;
  return out;
}

/** Split the stored attributes JSON into a flat attribute list and a specs list. */
export function parseAttributes(raw: unknown): { attributes: KeyValue[]; specs: KeyValue[] } {
  const attributes: KeyValue[] = [];
  const specs: KeyValue[] = [];
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as ProductAttributes;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "specs") {
        if (value && typeof value === "object") for (const [sk, sv] of Object.entries(value)) if (typeof sv === "string") specs.push({ key: sk, value: sv });
      } else if (typeof value === "string" && value.trim()) attributes.push({ key, value });
    }
  }
  return { attributes, specs };
}

export function buildAttributes(attributes: KeyValue[], specs: KeyValue[]): ProductAttributes {
  const out: ProductAttributes = {};
  for (const a of attributes) if (a.key.trim()) out[a.key.trim()] = a.value.trim();
  const s: Record<string, string> = {};
  for (const x of specs) if (x.key.trim()) s[x.key.trim()] = x.value.trim();
  if (Object.keys(s).length) out.specs = s;
  return out;
}

export function asTimeline(raw: unknown): TimelineEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
    .map((e) => ({ status: String(e.status ?? ""), at: String(e.at ?? ""), ...(typeof e.note === "string" && e.note ? { note: e.note } : {}) }));
}

export function toVariantDTO(v: ProductVariant): VariantDTO {
  return { id: v.id, name: v.name, options: asOptions(v.options), price: v.price, sku: v.sku, stock: v.stock, imageUrl: v.imageUrl, isActive: v.isActive };
}

export function toCategoryDTO(c: ProductCategory & { _count?: { products: number } }): CategoryDTO {
  return { id: c.id, slug: c.slug, name: asLocalized(c.name), imageUrl: c.imageUrl, parentId: c.parentId, productCount: c._count?.products ?? 0 };
}

export function toProductDTO(p: Product & { category?: ProductCategory | null; variants?: ProductVariant[] }): ProductDTO {
  const { attributes, specs } = parseAttributes(p.attributes);
  const seo = (p.seo && typeof p.seo === "object" && !Array.isArray(p.seo) ? p.seo : {}) as { title?: string; description?: string };
  return {
    id: p.id,
    slug: p.slug,
    name: asLocalized(p.name),
    shortDesc: asLocalized(p.shortDesc),
    description: asLocalized(p.description),
    price: p.price,
    comparePrice: p.comparePrice,
    sku: p.sku,
    stock: p.stock,
    trackStock: p.trackStock,
    images: p.images,
    attributes,
    specs,
    tags: p.tags,
    isFeatured: p.isFeatured,
    requiresPrescription: p.requiresPrescription,
    genericName: p.genericName,
    manufacturer: p.manufacturer,
    dosageForm: p.dosageForm,
    strength: p.strength,
    category: p.category ? { id: p.category.id, slug: p.category.slug, name: asLocalized(p.category.name) } : null,
    variants: (p.variants ?? []).filter((v) => v.isActive).map(toVariantDTO),
    seo: { title: typeof seo.title === "string" ? seo.title : undefined, description: typeof seo.description === "string" ? seo.description : undefined },
    createdAt: p.createdAt.toISOString(),
  };
}

export function toShippingZoneDTO(z: ShippingZone): ShippingZoneDTO {
  return { id: z.id, name: z.name, cities: z.cities, fee: z.fee, freeAbove: z.freeAbove, etaDays: z.etaDays };
}

export function toOrderDTO(o: Order & { items: (OrderItem & { product?: { slug: string } | null })[] }): OrderDTO {
  return {
    id: o.id,
    number: o.number,
    status: o.status as OrderStatusValue,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    address: o.address,
    city: o.city,
    notes: o.notes,
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    total: o.total,
    couponCode: o.couponCode,
    paymentMethod: o.paymentMethod,
    giftMessage: o.giftMessage,
    hasPrescription: !!o.prescriptionId,
    timeline: asTimeline(o.timeline),
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      variantName: i.variantName,
      imageUrl: i.imageUrl,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      total: i.total,
      slug: i.product?.slug ?? null,
    })),
    createdAt: o.createdAt.toISOString(),
  };
}
