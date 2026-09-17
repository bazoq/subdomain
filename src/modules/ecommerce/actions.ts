"use server";

/**
 * Ecommerce server actions.
 *  - Public (visitor on a tenant host): placeOrder, validateCoupon, getOrderStatus, submitPrescription
 *  - Tenant admin: products, categories, orders, coupons, shipping zones, prescriptions
 * Every query is scoped by the tenant resolved from the host / session — never from the request body.
 */
import { revalidatePath } from "next/cache";
import { db, json } from "@/server/db";
import { Prisma } from "@/generated/prisma/client";
import { requireTenant, currentLang } from "@/server/site";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { notifyTenant } from "@/server/notify";
import { formatPKR, normalizePkPhone } from "@/lib/utils";
import { t, ui } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { buildAttributes, asTimeline, toOrderDTO, toShippingZoneDTO } from "./mappers";
import { computeShipping, couponDiscount, orderLabel, phoneLast4 } from "./pricing";
import {
  categoryInputSchema,
  checkoutInputSchema,
  couponInputSchema,
  orderStatusSchema,
  prescriptionInputSchema,
  prescriptionStatusSchema,
  productInputSchema,
  shippingZoneInputSchema,
} from "./schemas";
import type { OrderDTO, TimelineEntry } from "./types";
import type { TenantContext } from "@/server/tenant";
import type { TenantAdminContext } from "@/server/auth/guards";

/* ═══════════════════════════════ helpers ═══════════════════════════════ */

type CouponRow = { id: string; code: string; type: string; value: number; minOrder: number; maxUses: number | null; usedCount: number; expiresAt: Date | null; isActive: boolean };

function checkCoupon(c: CouponRow | null, subtotal: number): { ok: true; coupon: CouponRow; discount: number } | { ok: false; message: string } {
  if (!c || !c.isActive) return { ok: false, message: "This coupon code is not valid." };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return { ok: false, message: "This coupon has expired." };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { ok: false, message: "This coupon has reached its usage limit." };
  if (subtotal < c.minOrder) return { ok: false, message: `This coupon requires a minimum order of ${formatPKR(c.minOrder)}.` };
  const discount = couponDiscount(c, subtotal);
  if (discount <= 0) return { ok: false, message: "This coupon does not apply to your order." };
  return { ok: true, coupon: c, discount };
}

async function findCoupon(tenantId: string, code: string): Promise<CouponRow | null> {
  return db.coupon.findFirst({ where: { tenantId, code: { equals: code.trim(), mode: "insensitive" } } });
}

function adminAudit(ctx: TenantAdminContext, action: string, entity: string, entityId?: string, meta?: Record<string, unknown>) {
  return audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action, entity, entityId, meta });
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/* ═══════════════════════════════ public: checkout ═══════════════════════════════ */

type PricedLine = {
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  trackStock: boolean;
  requiresPrescription: boolean;
};

class CheckoutError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Re-price every line from the database; throws CheckoutError on any problem. */
async function priceLines(tc: TenantContext, lines: { productId: string; variantId: string | null; qty: number }[], lang: "en" | "ur"): Promise<PricedLine[]> {
  // merge duplicate lines
  const merged = new Map<string, { productId: string; variantId: string | null; qty: number }>();
  for (const l of lines) {
    const key = `${l.productId}:${l.variantId ?? ""}`;
    const prev = merged.get(key);
    if (prev) prev.qty = Math.min(99, prev.qty + l.qty);
    else merged.set(key, { ...l });
  }
  const ids = Array.from(new Set(lines.map((l) => l.productId)));
  const products = await db.product.findMany({ where: { tenantId: tc.tenant.id, id: { in: ids }, isActive: true }, include: { variants: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const out: PricedLine[] = [];
  for (const l of merged.values()) {
    const p = byId.get(l.productId);
    if (!p) throw new CheckoutError("One of the items in your cart is no longer available. Please review your cart.");
    const name = t(p.name as { en: string; ur?: string }, lang) || (p.name as { en: string }).en;
    const variant = l.variantId ? p.variants.find((v) => v.id === l.variantId && v.isActive) : null;
    if (l.variantId && !variant) throw new CheckoutError(`The selected option for "${name}" is no longer available.`);
    if (!l.variantId && p.variants.some((v) => v.isActive)) throw new CheckoutError(`Please choose an option for "${name}".`);
    const available = variant ? variant.stock : p.stock;
    if (p.trackStock && l.qty > available) {
      throw new CheckoutError(available > 0 ? `Only ${available} left in stock for "${name}${variant ? ` (${variant.name})` : ""}".` : `"${name}" is out of stock.`);
    }
    out.push({
      productId: p.id,
      variantId: variant?.id ?? null,
      name,
      variantName: variant?.name ?? null,
      imageUrl: variant?.imageUrl || p.images[0] || null,
      unitPrice: variant?.price ?? p.price,
      qty: l.qty,
      trackStock: p.trackStock,
      requiresPrescription: p.requiresPrescription,
    });
  }
  return out;
}

export async function placeOrder(input: unknown): Promise<ActionResult<{ number: number; label: string; phoneLast4: string }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (d.website) return fail("Unable to place order.");

  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `checkout:${ip}`, limit: 5, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many attempts. Please wait a few minutes and try again.");

  const commerce = tc.settings.commerce;
  if (!commerce.codEnabled) return fail("Online ordering is currently paused. Please contact us on WhatsApp to order.");

  const phone = normalizePkPhone(d.phone);
  if (!phone) return fail("Please fix the highlighted fields.", { phone: "Enter a valid Pakistani mobile number, e.g. 0300-1234567" });
  if (commerce.ageConfirmation && !d.ageConfirmed) return fail("Please fix the highlighted fields.", { ageConfirmed: "You must confirm you are 18 or older." });

  try {
    const lines = await priceLines(tc, d.items, lang);
    const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
    if (commerce.minOrder > 0 && subtotal < commerce.minOrder) return fail(`Minimum order amount is ${formatPKR(commerce.minOrder)}.`);

    // prescription
    const needsRx = lines.some((l) => l.requiresPrescription);
    let rxMediaId: string | null = null;
    if (needsRx) {
      if (!d.prescriptionMediaId) return fail("Please fix the highlighted fields.", { prescriptionMediaId: "A prescription is required for one or more items." });
      const media = await db.media.findFirst({ where: { id: d.prescriptionMediaId, tenantId: tc.tenant.id, visibility: "PRIVATE", confirmed: true }, select: { id: true } });
      if (!media) return fail("Please fix the highlighted fields.", { prescriptionMediaId: "The uploaded prescription could not be verified. Please upload it again." });
      rxMediaId = media.id;
    }

    // shipping
    const zones = (await db.shippingZone.findMany({ where: { tenantId: tc.tenant.id, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })).map(toShippingZoneDTO);
    const quote = computeShipping({ zones, city: d.city, subtotal, commerce });

    // coupon
    let discount = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    if (d.couponCode) {
      const res = checkCoupon(await findCoupon(tc.tenant.id, d.couponCode), subtotal);
      if (!res.ok) return fail("Please fix the highlighted fields.", { couponCode: res.message });
      discount = res.discount;
      couponId = res.coupon.id;
      couponCode = res.coupon.code;
    }
    const total = Math.max(0, subtotal - discount) + quote.fee;
    const now = new Date();
    const timeline: TimelineEntry[] = [{ status: "PENDING", at: now.toISOString(), note: "Order placed from website" }];

    let number = 0;
    let orderId = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const created = await db.$transaction(async (tx) => {
          const agg = await tx.order.aggregate({ where: { tenantId: tc.tenant.id }, _max: { number: true } });
          const nextNumber = (agg._max.number ?? 0) + 1;

          const customer = await tx.customer.upsert({
            where: { tenantId_phone: { tenantId: tc.tenant.id, phone } },
            create: { tenantId: tc.tenant.id, phone, name: d.name, email: d.email || null, address: d.address, city: d.city },
            update: { name: d.name, ...(d.email ? { email: d.email } : {}), address: d.address, city: d.city },
          });

          let prescriptionId: string | null = null;
          if (rxMediaId) {
            const rx = await tx.prescription.create({ data: { tenantId: tc.tenant.id, mediaId: rxMediaId, customerName: d.name, customerPhone: phone, notes: d.notes || null } });
            prescriptionId = rx.id;
          }

          const order = await tx.order.create({
            data: {
              tenantId: tc.tenant.id,
              number: nextNumber,
              customerId: customer.id,
              customerName: d.name,
              customerPhone: phone,
              customerEmail: d.email || null,
              address: d.address,
              city: d.city,
              notes: d.notes || null,
              subtotal,
              shipping: quote.fee,
              discount,
              total,
              couponCode,
              paymentMethod: "COD",
              status: "PENDING",
              timeline: json(timeline),
              giftMessage: d.giftMessage || null,
              prescriptionId,
              ageConfirmed: !!d.ageConfirmed,
              ip,
              items: {
                create: lines.map((l) => ({
                  tenantId: tc.tenant.id,
                  productId: l.productId,
                  variantId: l.variantId,
                  name: l.name,
                  variantName: l.variantName,
                  imageUrl: l.imageUrl,
                  unitPrice: l.unitPrice,
                  quantity: l.qty,
                  total: l.unitPrice * l.qty,
                })),
              },
            },
          });

          for (const l of lines) {
            if (!l.trackStock) continue;
            const r = l.variantId
              ? await tx.productVariant.updateMany({ where: { id: l.variantId, tenantId: tc.tenant.id, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } })
              : await tx.product.updateMany({ where: { id: l.productId, tenantId: tc.tenant.id, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
            if (!r.count) throw new CheckoutError(`"${l.name}" just went out of stock. Please update your cart.`);
          }
          if (couponId) await tx.coupon.updateMany({ where: { id: couponId, tenantId: tc.tenant.id }, data: { usedCount: { increment: 1 } } });
          return order;
        });
        number = created.number;
        orderId = created.id;
        break;
      } catch (e) {
        if (isUniqueViolation(e) && attempt < 2) continue; // concurrent order number; retry
        throw e;
      }
    }
    if (!number) return fail(t(ui.somethingWrong, lang));

    const label = orderLabel(commerce.orderPrefix, number);
    notifyTenant(tc, {
      subject: `New order ${label} — ${formatPKR(total)} (${d.name}, ${d.city})`,
      text: [
        `${d.name} · ${phone}${d.email ? ` · ${d.email}` : ""}`,
        `${d.address}, ${d.city}`,
        "",
        ...lines.map((l) => `${l.qty} × ${l.name}${l.variantName ? ` (${l.variantName})` : ""} — ${formatPKR(l.unitPrice * l.qty)}`),
        "",
        `Subtotal ${formatPKR(subtotal)} · Shipping ${formatPKR(quote.fee)}${discount ? ` · Discount -${formatPKR(discount)}` : ""} · Total ${formatPKR(total)} (COD)`,
        d.notes ? `Notes: ${d.notes}` : "",
        needsRx ? "Prescription attached." : "",
        `Open admin: /admin/orders/${orderId}`,
      ].join("\n"),
    }).catch(() => undefined);

    return success(t(ui.orderPlaced, lang), { number, label, phoneLast4: phoneLast4(phone) });
  } catch (e) {
    if (e instanceof CheckoutError) return fail(e.message, e.fieldErrors);
    console.error("placeOrder failed", e);
    return fail(t(ui.somethingWrong, lang));
  }
}

export async function validateCoupon(code: unknown, subtotal: unknown): Promise<ActionResult<{ code: string; type: string; value: number; discount: number }>> {
  const tc = await requireTenant();
  const c = typeof code === "string" ? code.trim().slice(0, 40) : "";
  const s = typeof subtotal === "number" && Number.isFinite(subtotal) ? Math.max(0, Math.floor(subtotal)) : 0;
  if (!c) return fail("Enter a coupon code.");
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `coupon:${ip}`, limit: 20, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many attempts. Please try again later.");
  const res = checkCoupon(await findCoupon(tc.tenant.id, c), s);
  if (!res.ok) return fail(res.message);
  return success(`Coupon ${res.coupon.code} applied.`, { code: res.coupon.code, type: res.coupon.type, value: res.coupon.value, discount: res.discount });
}

/** Public order lookup: order number (with or without prefix) + the phone used at checkout. */
export async function getOrderStatus(number: unknown, phone: unknown): Promise<ActionResult<OrderDTO>> {
  const tc = await requireTenant();
  const n = parseInt(String(number ?? "").replace(/\D/g, ""), 10);
  const p = typeof phone === "string" ? normalizePkPhone(phone) : null;
  if (!Number.isFinite(n) || n <= 0) return fail("Enter your order number.", { number: "Enter a valid order number" });
  if (!p) return fail("Enter the mobile number used at checkout.", { phone: "Enter a valid mobile number" });
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `track:${ip}`, limit: 20, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many attempts. Please try again later.");
  const order = await db.order.findFirst({ where: { tenantId: tc.tenant.id, number: n, customerPhone: p }, include: { items: { include: { product: { select: { slug: true } } } } } });
  if (!order) return fail("No order found with these details.");
  return success(undefined, toOrderDTO(order));
}

/** Standalone prescription upload (medical stores). */
export async function submitPrescription(input: unknown): Promise<ActionResult> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!tc.category.modules.includes("medical")) return fail("Not available.");
  const parsed = prescriptionInputSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (d.website) return success(t(ui.thankYou, lang));
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `form:prescription:${ip}`, limit: 5, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many submissions. Please try again later.");
  const phone = normalizePkPhone(d.phone);
  if (!phone) return fail("Please fix the highlighted fields.", { phone: "Enter a valid Pakistani mobile number" });
  const media = await db.media.findFirst({ where: { id: d.mediaId, tenantId: tc.tenant.id, visibility: "PRIVATE", confirmed: true }, select: { id: true } });
  if (!media) return fail("Please fix the highlighted fields.", { mediaId: "The uploaded file could not be verified. Please upload again." });
  const rx = await db.prescription.create({ data: { tenantId: tc.tenant.id, mediaId: media.id, customerName: d.name, customerPhone: phone, notes: d.notes || null } });
  await db.customer.upsert({
    where: { tenantId_phone: { tenantId: tc.tenant.id, phone } },
    create: { tenantId: tc.tenant.id, phone, name: d.name },
    update: { name: d.name },
  });
  notifyTenant(tc, {
    subject: `New prescription from ${d.name}`,
    text: `${d.name} (${phone})\n${d.notes ?? ""}\n\nOpen admin: /admin/prescriptions (id ${rx.id})`,
  }).catch(() => undefined);
  return success(t(ui.thankYou, lang));
}

/* ═══════════════════════════════ admin: products ═══════════════════════════════ */

export async function upsertProduct(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const tid = ctx.tenant.id;

    const clash = await db.product.findFirst({ where: { tenantId: tid, slug: d.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
    if (clash) return fail("Please fix the highlighted fields.", { slug: "Another product already uses this slug." });
    if (d.categoryId) {
      const cat = await db.productCategory.findFirst({ where: { id: d.categoryId, tenantId: tid }, select: { id: true } });
      if (!cat) return fail("Please fix the highlighted fields.", { categoryId: "Category not found." });
    }
    const isMedical = ctx.category.modules.includes("medical");
    const data = {
      slug: d.slug,
      name: json(d.name),
      shortDesc: json(d.shortDesc),
      description: json(d.description),
      categoryId: d.categoryId,
      price: d.price,
      comparePrice: d.comparePrice != null && d.comparePrice > d.price ? d.comparePrice : null,
      costPrice: d.costPrice,
      sku: d.sku || null,
      stock: d.stock,
      trackStock: d.trackStock,
      images: d.images.filter(Boolean),
      attributes: json(buildAttributes(d.attributes, d.specs)),
      tags: Array.from(new Set(d.tags.map((x) => x.toLowerCase()))),
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      requiresPrescription: isMedical ? d.requiresPrescription : false,
      genericName: isMedical ? d.genericName || null : null,
      manufacturer: d.manufacturer || null,
      dosageForm: isMedical ? d.dosageForm || null : null,
      strength: isMedical ? d.strength || null : null,
      seo: json({ ...(d.seoTitle ? { title: d.seoTitle } : {}), ...(d.seoDescription ? { description: d.seoDescription } : {}) }),
    };

    const productId = await db.$transaction(async (tx) => {
      let pid: string;
      if (id) {
        const existing = await tx.product.findFirst({ where: { id, tenantId: tid }, select: { id: true } });
        if (!existing) throw new Error("Product not found.");
        await tx.product.update({ where: { id }, data });
        pid = id;
      } else {
        const count = await tx.product.count({ where: { tenantId: tid } });
        const row = await tx.product.create({ data: { ...data, tenantId: tid, sortOrder: count } });
        pid = row.id;
      }
      // variants sync
      const existing = await tx.productVariant.findMany({ where: { productId: pid, tenantId: tid }, select: { id: true } });
      const existingIds = new Set(existing.map((v) => v.id));
      const keepIds = new Set(d.variants.map((v) => v.id).filter((x): x is string => !!x && existingIds.has(x)));
      const toDelete = existing.filter((v) => !keepIds.has(v.id)).map((v) => v.id);
      if (toDelete.length) await tx.productVariant.deleteMany({ where: { id: { in: toDelete }, tenantId: tid } });
      for (const v of d.variants) {
        const vdata = { name: v.name, options: json(v.options), price: v.price, sku: v.sku || null, stock: v.stock, imageUrl: v.imageUrl || null, isActive: v.isActive };
        if (v.id && keepIds.has(v.id)) await tx.productVariant.update({ where: { id: v.id }, data: vdata });
        else await tx.productVariant.create({ data: { ...vdata, tenantId: tid, productId: pid } });
      }
      return pid;
    });

    await adminAudit(ctx, id ? "product.update" : "product.create", "Product", productId, { slug: d.slug });
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    return success(id ? "Product updated." : "Product created.", { id: productId });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.product.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await adminAudit(ctx, "product.delete", "Product", id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    return success("Product deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleProductFlag(id: string, flag: "isActive" | "isFeatured", value: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (flag !== "isActive" && flag !== "isFeatured") return fail("Invalid flag.");
    const { count } = await db.product.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { [flag]: !!value } });
    if (!count) return fail("Not found.");
    await adminAudit(ctx, `product.${flag}`, "Product", id, { value });
    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    return success(flag === "isActive" ? (value ? "Product is now visible." : "Product hidden from the shop.") : value ? "Marked as featured." : "Removed from featured.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ admin: categories ═══════════════════════════════ */

export async function upsertCategory(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = categoryInputSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const tid = ctx.tenant.id;
    const clash = await db.productCategory.findFirst({ where: { tenantId: tid, slug: d.slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
    if (clash) return fail("Please fix the highlighted fields.", { slug: "Another category already uses this slug." });
    if (d.parentId) {
      if (d.parentId === id) return fail("Please fix the highlighted fields.", { parentId: "A category cannot be its own parent." });
      const parent = await db.productCategory.findFirst({ where: { id: d.parentId, tenantId: tid }, select: { id: true, parentId: true } });
      if (!parent) return fail("Please fix the highlighted fields.", { parentId: "Parent category not found." });
      if (id && parent.parentId === id) return fail("Please fix the highlighted fields.", { parentId: "Cannot nest under one of this category's children." });
    }
    const data = { name: json(d.name), slug: d.slug, parentId: d.parentId, imageUrl: d.imageUrl || null, sortOrder: d.sortOrder, isActive: d.isActive };
    let row;
    if (id) {
      const existing = await db.productCategory.findFirst({ where: { id, tenantId: tid }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.productCategory.update({ where: { id }, data });
    } else {
      row = await db.productCategory.create({ data: { ...data, tenantId: tid } });
    }
    await adminAudit(ctx, id ? "product_category.update" : "product_category.create", "ProductCategory", row.id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products/categories");
    return success(id ? "Category updated." : "Category added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.productCategory.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await adminAudit(ctx, "product_category.delete", "ProductCategory", id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/products/categories");
    return success("Category deleted. Its products are now uncategorised.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ admin: orders ═══════════════════════════════ */

const STOCK_RELEASING = new Set(["CANCELLED", "RETURNED"]);

export async function updateOrderStatus(id: string, status: string, note?: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = orderStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const tid = ctx.tenant.id;
    const cleanNote = (note ?? "").trim().slice(0, 500);
    await db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, tenantId: tid }, include: { items: true } });
      if (!order) throw new Error("Order not found.");
      const wasReleased = STOCK_RELEASING.has(order.status);
      const willRelease = STOCK_RELEASING.has(s.data);
      // restore stock when cancelling / returning; take it again if an order is re-activated
      if (!wasReleased && willRelease) await adjustStock(tx, tid, order.items, +1);
      else if (wasReleased && !willRelease) await adjustStock(tx, tid, order.items, -1);
      const timeline = asTimeline(order.timeline);
      if (order.status !== s.data || cleanNote) timeline.push({ status: s.data, at: new Date().toISOString(), ...(cleanNote ? { note: cleanNote } : {}) });
      await tx.order.update({ where: { id: order.id }, data: { status: s.data, timeline: json(timeline) } });
    });
    await adminAudit(ctx, "order.status", "Order", id, { status: s.data, note: cleanNote });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    return success(`Order marked as ${s.data.toLowerCase()}.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

async function adjustStock(tx: Prisma.TransactionClient, tenantId: string, items: { productId: string | null; variantId: string | null; quantity: number }[], direction: 1 | -1) {
  for (const it of items) {
    if (!it.productId) continue;
    const product = await tx.product.findFirst({ where: { id: it.productId, tenantId }, select: { trackStock: true } });
    if (!product?.trackStock) continue;
    const change = direction > 0 ? { increment: it.quantity } : { decrement: it.quantity };
    if (it.variantId) await tx.productVariant.updateMany({ where: { id: it.variantId, tenantId }, data: { stock: change } });
    else await tx.product.updateMany({ where: { id: it.productId, tenantId }, data: { stock: change } });
  }
}

/* ═══════════════════════════════ admin: coupons ═══════════════════════════════ */

export async function upsertCoupon(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = couponInputSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    if (d.type === "PERCENT" && d.value > 100) return fail("Please fix the highlighted fields.", { value: "Percentage cannot exceed 100." });
    let expiresAt: Date | null = null;
    if (d.expiresAt) {
      const dt = new Date(d.expiresAt);
      if (Number.isNaN(dt.getTime())) return fail("Please fix the highlighted fields.", { expiresAt: "Invalid date." });
      dt.setHours(23, 59, 59, 999);
      expiresAt = dt;
    }
    const tid = ctx.tenant.id;
    const clash = await db.coupon.findFirst({ where: { tenantId: tid, code: { equals: d.code, mode: "insensitive" }, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
    if (clash) return fail("Please fix the highlighted fields.", { code: "This code already exists." });
    const data = { code: d.code, type: d.type, value: d.value, minOrder: d.minOrder, maxUses: d.maxUses, expiresAt, isActive: d.isActive };
    let row;
    if (id) {
      const existing = await db.coupon.findFirst({ where: { id, tenantId: tid }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.coupon.update({ where: { id }, data });
    } else row = await db.coupon.create({ data: { ...data, tenantId: tid } });
    await adminAudit(ctx, id ? "coupon.update" : "coupon.create", "Coupon", row.id, { code: d.code });
    revalidatePath("/admin/coupons");
    return success(id ? "Coupon updated." : "Coupon created.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.coupon.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await adminAudit(ctx, "coupon.delete", "Coupon", id);
    revalidatePath("/admin/coupons");
    return success("Coupon deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ admin: shipping zones ═══════════════════════════════ */

export async function upsertShippingZone(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = shippingZoneInputSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const tid = ctx.tenant.id;
    const cities = Array.from(new Set(d.cities.map((c) => c.trim()).filter(Boolean)));
    const data = { name: d.name, cities, fee: d.fee, freeAbove: d.freeAbove, etaDays: d.etaDays || null, sortOrder: d.sortOrder, isActive: d.isActive };
    let row;
    if (id) {
      const existing = await db.shippingZone.findFirst({ where: { id, tenantId: tid }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.shippingZone.update({ where: { id }, data });
    } else row = await db.shippingZone.create({ data: { ...data, tenantId: tid } });
    await adminAudit(ctx, id ? "shipping_zone.update" : "shipping_zone.create", "ShippingZone", row.id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/shipping");
    return success(id ? "Zone updated." : "Zone added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteShippingZone(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.shippingZone.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await adminAudit(ctx, "shipping_zone.delete", "ShippingZone", id);
    revalidatePath("/", "layout");
    revalidatePath("/admin/shipping");
    return success("Zone deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ admin: prescriptions ═══════════════════════════════ */

export async function updatePrescriptionStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = prescriptionStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const { count } = await db.prescription.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { status: s.data } });
    if (!count) return fail("Not found.");
    await adminAudit(ctx, "prescription.status", "Prescription", id, { status: s.data });
    revalidatePath("/admin/prescriptions");
    return success(`Prescription marked as ${s.data.toLowerCase()}.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}
