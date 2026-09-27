"use server";

/**
 * Ecommerce server actions.
 *  - Public (visitor on a tenant host): placeOrder, validateCoupon, getOrderStatus, submitPrescription
 *  - Tenant admin: products, categories, orders, coupons, shipping zones, prescriptions
 * Every query is scoped by the tenant resolved from the host / session — never from the request body.
 */
import { revalidatePath } from "next/cache";
import { db, isUniqueViolation, json } from "@/server/db";
import { Prisma } from "@/generated/prisma/client";
import { requireTenant, currentLang } from "@/server/site";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { notifyTenant, replyWhatsAppLink } from "@/server/notify";
import { formatPKR, normalizePkPhone } from "@/lib/utils";
import { t, ui, type Lang } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { errorFields, log } from "@/lib/log";
import { buildAttributes, asTimeline, toOrderDTO, toShippingZoneDTO } from "./mappers";
import { computeShipping, couponDiscount, orderLabel, phoneLast4 } from "./pricing";
import { orderToken } from "./order-token";
import { findOrderByIdempotencyKey } from "./idempotency";
import { hasModule } from "@/modules/shared/module-gate";
import { m } from "./messages";
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
import { canTransitionOrder, ORDER_TRANSITIONS, STOCK_RELEASING_STATUSES, type OrderDTO, type OrderStatusValue, type PlacedOrder, type TimelineEntry } from "./types";
import type { TenantContext } from "@/server/tenant";
import type { TenantAdminContext } from "@/server/auth/guards";

/* ═══════════════════════════════ helpers ═══════════════════════════════ */

type CouponRow = { id: string; code: string; type: string; value: number; minOrder: number; maxUses: number | null; usedCount: number; expiresAt: Date | null; isActive: boolean };

function checkCoupon(c: CouponRow | null, subtotal: number, lang: Lang): { ok: true; coupon: CouponRow; discount: number } | { ok: false; message: string } {
  if (!c || !c.isActive) return { ok: false, message: m("couponInvalid", lang) };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return { ok: false, message: m("couponExpired", lang) };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { ok: false, message: m("couponUsedUp", lang) };
  if (subtotal < c.minOrder) return { ok: false, message: m("couponMin", lang, { amount: formatPKR(c.minOrder) }) };
  const discount = couponDiscount(c, subtotal);
  if (discount <= 0) return { ok: false, message: m("couponNoEffect", lang) };
  return { ok: true, coupon: c, discount };
}

async function findCoupon(tenantId: string, code: string): Promise<CouponRow | null> {
  return db.coupon.findFirst({ where: { tenantId, code: { equals: code.trim(), mode: "insensitive" } } });
}

function adminAudit(ctx: TenantAdminContext, action: string, entity: string, entityId?: string, meta?: Record<string, unknown>) {
  return audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action, entity, entityId, meta });
}

/**
 * End of a calendar day in Pakistan (Asia/Karachi, UTC+5, no DST) for a `YYYY-MM-DD` input.
 * Coupons entered as "expires 30 Sep" must stay valid until midnight in Karachi, not midnight UTC on the Vercel server.
 */
function pkEndOfDay(input: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.trim());
  if (!m) return null;
  const dt = new Date(`${m[1]}-${m[2]}-${m[3]}T23:59:59.999+05:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
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
async function priceLines(tc: TenantContext, lines: { productId: string; variantId: string | null; qty: number }[], lang: Lang): Promise<PricedLine[]> {
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
    if (!p) throw new CheckoutError(m("itemUnavailable", lang));
    const name = t(p.name as { en: string; ur?: string }, lang) || (p.name as { en: string }).en;
    const variant = l.variantId ? p.variants.find((v) => v.id === l.variantId && v.isActive) : null;
    if (l.variantId && !variant) throw new CheckoutError(m("optionUnavailable", lang, { name }));
    if (!l.variantId && p.variants.some((v) => v.isActive)) throw new CheckoutError(m("chooseOption", lang, { name }));
    const available = variant ? variant.stock : p.stock;
    if (p.trackStock && l.qty > available) {
      const label = `${name}${variant ? ` (${variant.name})` : ""}`;
      throw new CheckoutError(available > 0 ? m("onlyLeft", lang, { n: available, name: label }) : m("outOfStock", lang, { name: label }));
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

const IDEM_SCOPE = "shop";

export async function placeOrder(input: unknown): Promise<ActionResult<PlacedOrder>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!hasModule(tc, "ecommerce")) return fail(m("notAvailable", lang));
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  const tid = tc.tenant.id;
  const commerce = tc.settings.commerce;
  const placed = (number: number, phone: string): PlacedOrder => ({ number, label: orderLabel(commerce.orderPrefix, number), token: orderToken("shop", tid, number), phoneLast4: phoneLast4(phone) });
  // honeypot filled → bot. Pretend success (number 0, no token) so the bot learns nothing; the client goes back to /shop.
  if (d.website) return success(t(ui.orderPlaced, lang), { number: 0, label: "", token: "", phoneLast4: "" });
  // suspended by the platform: the storefront layout shows a notice, but the action is callable directly, so refuse here too
  if (tc.tenant.status === "SUSPENDED") return fail(m("storeUnavailable", lang));

  const ip = await clientIp();
  // Pakistani mobile networks put whole neighbourhoods behind one CGNAT address, so the per-IP limit is generous
  // and abuse is caught by the per-phone limit instead.
  const rl = await rateLimit({ bucket: `checkout:${ip}`, limit: 15, windowSec: 600, tenantId: tid });
  if (!rl.ok) return fail(m("tooManyAttempts", lang));

  if (!commerce.codEnabled) return fail(m("orderingPaused", lang));

  const phone = normalizePkPhone(d.phone);
  if (!phone) return fail(m("fixFields", lang), { phone: m("invalidPhone", lang) });
  const rlPhone = await rateLimit({ bucket: `checkout:phone:${phone}`, limit: 10, windowSec: 3600, tenantId: tid });
  if (!rlPhone.ok) return fail(m("tooManyAttempts", lang));
  if (commerce.ageConfirmation && !d.ageConfirmed) return fail(m("fixFields", lang), { ageConfirmed: m("ageRequired", lang) });

  // duplicate-submit protection: same key → same order (Order.idempotencyKey is unique per tenant, see idempotency.ts)
  const idem = d.idempotencyKey ?? null;
  const alreadyPlaced = (dup: { number: number; customerPhone: string }) => {
    // the key is per browser checkout; a different phone means the form was edited after the first attempt went through
    if (dup.customerPhone !== phone) return fail(m("alreadySubmitted", lang));
    return success(t(ui.orderPlaced, lang), placed(dup.number, phone));
  };
  if (idem) {
    const dup = await findOrderByIdempotencyKey(IDEM_SCOPE, tid, idem);
    if (dup) return alreadyPlaced(dup);
  }

  try {
    const lines = await priceLines(tc, d.items, lang);
    const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
    if (commerce.minOrder > 0 && subtotal < commerce.minOrder) throw new CheckoutError(m("minOrder", lang, { amount: formatPKR(commerce.minOrder) }));

    // prescription
    const needsRx = lines.some((l) => l.requiresPrescription);
    let rxMediaId: string | null = null;
    if (needsRx) {
      if (!d.prescriptionMediaId) throw new CheckoutError(m("fixFields", lang), { prescriptionMediaId: m("rxRequired", lang) });
      const media = await db.media.findFirst({ where: { id: d.prescriptionMediaId, tenantId: tid, visibility: "PRIVATE", confirmed: true }, select: { id: true } });
      if (!media) throw new CheckoutError(m("fixFields", lang), { prescriptionMediaId: m("rxInvalid", lang) });
      rxMediaId = media.id;
    }

    // shipping (authoritative: zones + settings from the DB, city from the form)
    const zones = (await db.shippingZone.findMany({ where: { tenantId: tid, isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })).map(toShippingZoneDTO);
    const quote = computeShipping({ zones, city: d.city, subtotal, commerce });

    // coupon (validated here; usage is claimed atomically inside the transaction)
    let discount = 0;
    let coupon: CouponRow | null = null;
    if (d.couponCode) {
      const res = checkCoupon(await findCoupon(tid, d.couponCode), subtotal, lang);
      if (!res.ok) throw new CheckoutError(m("fixFields", lang), { couponCode: res.message });
      discount = res.discount;
      coupon = res.coupon;
    }
    const total = Math.max(0, subtotal - discount) + quote.fee;
    const now = new Date();
    const timeline: TimelineEntry[] = [{ status: "PENDING", at: now.toISOString(), note: "Order placed from website" }];

    let number = 0;
    let orderId = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const created = await db.$transaction(async (tx) => {
          const agg = await tx.order.aggregate({ where: { tenantId: tid }, _max: { number: true } });
          const nextNumber = (agg._max.number ?? 0) + 1;

          const customer = await tx.customer.upsert({
            where: { tenantId_phone: { tenantId: tid, phone } },
            create: { tenantId: tid, phone, name: d.name, email: d.email || null, address: d.address, city: d.city },
            update: { name: d.name, ...(d.email ? { email: d.email } : {}), address: d.address, city: d.city },
          });

          let prescriptionId: string | null = null;
          if (rxMediaId) {
            const rx = await tx.prescription.create({ data: { tenantId: tid, mediaId: rxMediaId, customerName: d.name, customerPhone: phone, notes: d.notes || null } });
            prescriptionId = rx.id;
          }

          const order = await tx.order.create({
            data: {
              tenantId: tid,
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
              couponCode: coupon?.code ?? null,
              paymentMethod: "COD",
              status: "PENDING",
              timeline: json(timeline),
              idempotencyKey: idem,
              giftMessage: d.giftMessage || null,
              prescriptionId,
              ageConfirmed: !!d.ageConfirmed,
              ip,
              items: {
                create: lines.map((l) => ({
                  tenantId: tid,
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

          // atomic stock guard: the row is only decremented when enough stock is still there
          for (const l of lines) {
            if (!l.trackStock) continue;
            const r = l.variantId
              ? await tx.productVariant.updateMany({ where: { id: l.variantId, tenantId: tid, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } })
              : await tx.product.updateMany({ where: { id: l.productId, tenantId: tid, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
            if (!r.count) throw new CheckoutError(m("justSoldOut", lang, { name: l.name }));
          }
          // atomic coupon usage guard (maxUses can not be exceeded by concurrent checkouts)
          if (coupon) {
            const r = await tx.coupon.updateMany({
              where: { id: coupon.id, tenantId: tid, isActive: true, ...(coupon.maxUses != null ? { usedCount: { lt: coupon.maxUses } } : {}) },
              data: { usedCount: { increment: 1 } },
            });
            if (!r.count) throw new CheckoutError(m("fixFields", lang), { couponCode: m("couponUsedUp", lang) });
          }
          return order;
        });
        number = created.number;
        orderId = created.id;
        break;
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
        if (idem) {
          // a concurrent submit with the same key committed first: hand its order back instead of creating a second one
          const dup = await findOrderByIdempotencyKey(IDEM_SCOPE, tid, idem);
          if (dup) return alreadyPlaced(dup);
        }
        if (attempt === 2) throw e; // concurrent order number three times in a row
      }
    }
    if (!number) throw new Error("order number allocation failed");

    const result = placed(number, phone);
    notifyTenant(tc, {
      subject: `New order ${result.label} — ${formatPKR(total)} (${d.name}, ${d.city})`,
      text: [
        `${d.name} · ${phone}${d.email ? ` · ${d.email}` : ""}`,
        `${d.address}, ${d.city}`,
        `Reply on WhatsApp: ${replyWhatsAppLink(phone, `Assalam o Alaikum ${d.name}, this is ${tc.tenant.name} regarding your order ${result.label}.`) ?? phone}`,
        `Tracking link for the customer: https://${tc.host}/order/${number}?t=${result.token}`,
        "",
        ...lines.map((l) => `${l.qty} × ${l.name}${l.variantName ? ` (${l.variantName})` : ""} — ${formatPKR(l.unitPrice * l.qty)}`),
        "",
        `Subtotal ${formatPKR(subtotal)} · Shipping ${formatPKR(quote.fee)}${discount ? ` · Discount -${formatPKR(discount)}` : ""} · Total ${formatPKR(total)} (COD)`,
        d.notes ? `Notes: ${d.notes}` : "",
        needsRx ? "Prescription attached." : "",
        `Open admin: https://${tc.host}/admin/orders/${orderId}`,
      ]
        .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
        .join("\n"),
    }).catch(() => undefined);

    // stock changed → storefront availability badges and admin lists must not show stale data
    revalidatePath("/", "layout");
    return success(t(ui.orderPlaced, lang), result);
  } catch (e) {
    if (e instanceof CheckoutError) return fail(e.message, e.fieldErrors);
    log.error("order.place_failed", { tenantId: tid, ...errorFields(e) });
    return fail(t(ui.somethingWrong, lang));
  }
}

export async function validateCoupon(code: unknown, subtotal: unknown): Promise<ActionResult<{ code: string; type: string; value: number; discount: number }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!hasModule(tc, "ecommerce")) return fail(m("notAvailable", lang));
  const c = typeof code === "string" ? code.trim().slice(0, 40) : "";
  const s = typeof subtotal === "number" && Number.isFinite(subtotal) ? Math.max(0, Math.floor(subtotal)) : 0;
  if (tc.tenant.status === "SUSPENDED") return fail(m("storeUnavailable", lang));
  if (!c) return fail(m("enterCoupon", lang));
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `coupon:${ip}`, limit: 30, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail(m("tooManyRequests", lang));
  const res = checkCoupon(await findCoupon(tc.tenant.id, c), s, lang);
  if (!res.ok) return fail(res.message);
  return success(m("couponApplied", lang, { code: res.coupon.code }), { code: res.coupon.code, type: res.coupon.type, value: res.coupon.value, discount: res.discount });
}

/**
 * Public order lookup: order number (with or without prefix) + the full phone used at checkout.
 * Returns the order plus an access token so the client can move to the bookmarkable /order/[n]?t=… URL.
 */
export async function getOrderStatus(number: unknown, phone: unknown): Promise<ActionResult<OrderDTO & { token: string }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!hasModule(tc, "ecommerce")) return fail(m("notAvailable", lang));
  const n = parseInt(String(number ?? "").replace(/\D/g, ""), 10);
  const p = typeof phone === "string" ? normalizePkPhone(phone) : null;
  if (tc.tenant.status === "SUSPENDED") return fail(m("storeUnavailable", lang));
  if (!Number.isFinite(n) || n <= 0) return fail(m("enterOrderNumber", lang), { number: m("enterOrderNumber", lang) });
  if (!p) return fail(m("enterPhoneUsed", lang), { phone: m("invalidPhone", lang) });
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `track:${ip}`, limit: 20, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail(m("tooManyRequests", lang));
  const order = await db.order.findFirst({ where: { tenantId: tc.tenant.id, number: n, customerPhone: p }, include: { items: { include: { product: { select: { slug: true } } } } } });
  if (!order) return fail(m("orderNotFound", lang));
  return success(undefined, { ...toOrderDTO(order), token: orderToken("shop", tc.tenant.id, order.number) });
}

/** Standalone prescription upload (medical stores). */
export async function submitPrescription(input: unknown): Promise<ActionResult> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!hasModule(tc, "medical")) return fail(m("notAvailable", lang));
  const parsed = prescriptionInputSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (d.website) return success(t(ui.thankYou, lang));
  if (tc.tenant.status === "SUSPENDED") return fail(m("storeUnavailable", lang));
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `form:prescription:${ip}`, limit: 10, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail(m("tooManyRequests", lang));
  const phone = normalizePkPhone(d.phone);
  if (!phone) return fail(m("fixFields", lang), { phone: m("invalidPhone", lang) });
  const rlPhone = await rateLimit({ bucket: `form:prescription:phone:${phone}`, limit: 5, windowSec: 3600, tenantId: tc.tenant.id });
  if (!rlPhone.ok) return fail(m("tooManyRequests", lang));
  const media = await db.media.findFirst({ where: { id: d.mediaId, tenantId: tc.tenant.id, visibility: "PRIVATE", confirmed: true }, select: { id: true } });
  if (!media) return fail(m("fixFields", lang), { mediaId: m("rxInvalid", lang) });
  const rx = await db.prescription.create({ data: { tenantId: tc.tenant.id, mediaId: media.id, customerName: d.name, customerPhone: phone, notes: d.notes || null } });
  await db.customer.upsert({
    where: { tenantId_phone: { tenantId: tc.tenant.id, phone } },
    create: { tenantId: tc.tenant.id, phone, name: d.name },
    update: { name: d.name },
  });
  notifyTenant(tc, {
    subject: `New prescription from ${d.name}`,
    text: [`${d.name} · ${phone}`, `Reply on WhatsApp: ${replyWhatsAppLink(phone, `Assalam o Alaikum ${d.name}, this is ${tc.tenant.name} regarding your prescription.`) ?? phone}`, d.notes ? `\n${d.notes}` : "", "", `Open admin: https://${tc.host}/admin/prescriptions (id ${rx.id})`].filter((l) => l !== "").join("\n"),
  }).catch(() => undefined);
  revalidatePath("/", "layout");
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
    return success(id ? "Product updated." : "Product created.", { id: productId });
  } catch (e) {
    // two admins saving the same slug at the same time: the pre-check passed for both, the unique index caught the loser
    if (isUniqueViolation(e)) return fail("Please fix the highlighted fields.", { slug: "Another product already uses this slug. Choose a different one." });
    return fail((e as Error).message);
  }
}

/**
 * Delete a product. When the product appears in any order it is archived (hidden, un-featured) instead, so order history,
 * reports and the admin order → product links keep working. Products with no order history are removed for real.
 */
export async function deleteProduct(id: string): Promise<ActionResult<{ archived: boolean }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const tid = ctx.tenant.id;
    const product = await db.product.findFirst({ where: { id, tenantId: tid }, select: { id: true, _count: { select: { orderItems: true } } } });
    if (!product) return fail("Not found.");
    const orders = product._count.orderItems;
    if (orders > 0) {
      await db.product.updateMany({ where: { id, tenantId: tid }, data: { isActive: false, isFeatured: false } });
      await adminAudit(ctx, "product.archive", "Product", id, { orderItems: orders });
      revalidatePath("/", "layout");
      return success(`This product is part of ${orders} past order line${orders === 1 ? "" : "s"}, so it was hidden from the shop instead of deleted. Its order history stays intact.`, { archived: true });
    }
    const { count } = await db.product.deleteMany({ where: { id, tenantId: tid } });
    if (!count) return fail("Not found.");
    await adminAudit(ctx, "product.delete", "Product", id);
    revalidatePath("/", "layout");
    return success("Product deleted.", { archived: false });
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
    return success(id ? "Category updated." : "Category added.", { id: row.id });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Please fix the highlighted fields.", { slug: "Another category already uses this slug. Choose a different one." });
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
    return success("Category deleted. Its products are now uncategorised.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ admin: orders ═══════════════════════════════ */

const pretty = (s: string) => s.toLowerCase().replace(/_/g, " ");

/**
 * Move a shop order along the fulfilment state machine (see ORDER_TRANSITIONS).
 *  - Illegal jumps (DELIVERED → PENDING, re-opening a CANCELLED order …) are refused with a clear message.
 *  - Concurrency: the update is `updateMany where status = <status we read>`, so two staff members acting on a stale
 *    screen cannot both apply a transition; the loser is told to refresh.
 *  - Stock is handed back exactly once, on the first entry into a releasing status, and only ever incremented here.
 *    Terminal statuses cannot be re-activated, so stock can never be driven negative by status changes.
 *  - Same status + note = "add a note to the timeline" (no transition).
 */
export async function updateOrderStatus(id: string, status: string, note?: string): Promise<ActionResult<{ status: OrderStatusValue }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = orderStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const tid = ctx.tenant.id;
    const cleanNote = (note ?? "").trim().slice(0, 500);
    const next = s.data;

    const outcome = await db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, tenantId: tid }, include: { items: true } });
      if (!order) return { kind: "missing" as const };
      const current = order.status as OrderStatusValue;
      if (!canTransitionOrder(current, next)) {
        const allowed = ORDER_TRANSITIONS[current];
        return { kind: "illegal" as const, current, allowed };
      }
      if (current === next && !cleanNote) return { kind: "noop" as const, current };

      const timeline = asTimeline(order.timeline);
      timeline.push({ status: next, at: new Date().toISOString(), ...(cleanNote ? { note: cleanNote } : {}) });
      // optimistic concurrency guard: only apply if nobody changed the status since we read it
      const r = await tx.order.updateMany({ where: { id: order.id, tenantId: tid, status: current }, data: { status: next, timeline: json(timeline) } });
      if (!r.count) return { kind: "conflict" as const };

      const releasesNow = STOCK_RELEASING_STATUSES.includes(next) && !STOCK_RELEASING_STATUSES.includes(current);
      if (releasesNow) await restoreStock(tx, tid, order.items);
      return { kind: "ok" as const, from: current, restored: releasesNow };
    });

    if (outcome.kind === "missing") return fail("Order not found.");
    if (outcome.kind === "illegal") {
      const hint = outcome.allowed.length ? `From ${pretty(outcome.current)} it can only go to: ${outcome.allowed.map(pretty).join(", ")}.` : `A ${pretty(outcome.current)} order is final; place a new order instead.`;
      return fail(`Cannot change this order from ${pretty(outcome.current)} to ${pretty(next)}. ${hint}`);
    }
    if (outcome.kind === "conflict") return fail("This order was just updated by someone else. Refresh the page and try again.");
    if (outcome.kind === "noop") return success("No change.", { status: outcome.current });

    await adminAudit(ctx, "order.status", "Order", id, { from: outcome.from, to: next, note: cleanNote || undefined, stockRestored: outcome.restored });
    revalidatePath("/", "layout"); // admin lists + storefront stock badges (tenant routes are dynamic; this purges the router cache)
    const msg = outcome.from === next ? "Note added to the timeline." : `Order marked as ${pretty(next)}.${outcome.restored ? " Stock for its items has been restored." : ""}`;
    return success(msg, { status: next });
  } catch (e) {
    return fail((e as Error).message);
  }
}

/** Hand the items of a cancelled / returned order back to the shelf (increment only; skips untracked products). */
async function restoreStock(tx: Prisma.TransactionClient, tenantId: string, items: { productId: string | null; variantId: string | null; quantity: number }[]) {
  for (const it of items) {
    if (!it.productId || it.quantity <= 0) continue;
    const product = await tx.product.findFirst({ where: { id: it.productId, tenantId }, select: { trackStock: true } });
    if (!product?.trackStock) continue;
    if (it.variantId) await tx.productVariant.updateMany({ where: { id: it.variantId, tenantId }, data: { stock: { increment: it.quantity } } });
    else await tx.product.updateMany({ where: { id: it.productId, tenantId }, data: { stock: { increment: it.quantity } } });
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
      expiresAt = pkEndOfDay(d.expiresAt);
      if (!expiresAt) return fail("Please fix the highlighted fields.", { expiresAt: "Enter the expiry date as YYYY-MM-DD." });
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
    revalidatePath("/", "layout");
    return success(id ? "Coupon updated." : "Coupon created.", { id: row.id });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Please fix the highlighted fields.", { code: "This code already exists. Choose a different code." });
    return fail((e as Error).message);
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.coupon.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await adminAudit(ctx, "coupon.delete", "Coupon", id);
    revalidatePath("/", "layout");
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
    revalidatePath("/", "layout");
    return success(`Prescription marked as ${s.data.toLowerCase()}.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}
