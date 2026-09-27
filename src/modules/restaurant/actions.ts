"use server";

/**
 * Restaurant module server actions: public ordering / reservations and tenant admin management.
 * Every query is scoped by the tenant resolved from the host (public) or the admin session (admin).
 * COD only, PKR integer rupees. Public order pages are gated by an HMAC token (see ecommerce/order-token.ts).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, isUniqueViolation, json } from "@/server/db";
import { requireTenant, currentLang } from "@/server/site";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { notifyTenant, replyWhatsAppLink } from "@/server/notify";
import { isOpenNow } from "@/templates/ui";
import { parseSettings, tenantSettingsSchema } from "@/lib/tenant-settings";
import { localizedString, t } from "@/lib/i18n";
import { formatPKR, normalizePkPhone, slugify } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { errorFields, log } from "@/lib/log";
import { orderToken, verifyOrderToken } from "@/modules/ecommerce/order-token";
import { findOrderByIdempotencyKey } from "@/modules/ecommerce/idempotency";
import { hasModule } from "@/modules/shared/module-gate";
import { itemInclude, toMenuItemDto } from "./queries";
import { toFoodOrderDto } from "./serialize";
import { hoursForDate, isOpenAt, pkDateTime, pkParts } from "./hours";
import { rm } from "./messages";
import {
  ACTIVE_FOOD_STATUSES,
  FOOD_ORDER_STATUSES,
  FOOD_ORDER_TYPES,
  MENU_TAGS,
  RESERVATION_STATUSES,
  RESERVATION_TRANSITIONS,
  STATUS_TRANSITIONS,
  canTransitionReservation,
  menuSizesSchema,
  parseTimeline,
  type FoodOrderDto,
  type FoodOrderStatusKey,
  type OrderItemModifier,
  type PlacedFoodOrder,
  type TimelineEntry,
} from "./types";

/* ═══════════════════════════════ PUBLIC: ORDERING ═══════════════════════════════ */

const orderLineSchema = z.object({
  menuItemId: z.string().min(1).max(64),
  sizeName: z.string().trim().max(40).optional(),
  modifierIds: z.array(z.string().max(64)).max(30).default([]),
  qty: z.coerce.number().int().min(1).max(50),
  note: z.string().trim().max(200).optional(),
});

const placeOrderSchema = z.object({
  type: z.enum(FOOD_ORDER_TYPES),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(7, "Please enter a valid mobile number").max(20),
  address: z.string().trim().max(400).optional(),
  zoneId: z.string().max(64).optional(),
  tableNumber: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(500).optional(),
  /** ISO / datetime-local string when the customer schedules for later */
  scheduledFor: z.string().max(40).optional(),
  /** random client-generated key; a retry with the same key never creates a second order */
  idempotencyKey: z
    .string()
    .regex(/^[A-Za-z0-9_-]{16,64}$/)
    .optional(),
  website: z.string().max(0).optional(), // honeypot
  lines: z.array(orderLineSchema).min(1, "Your order is empty").max(50),
});
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

interface PricedLine {
  menuItemId: string;
  name: string;
  sizeName: string | null;
  modifiers: OrderItemModifier[];
  unitPrice: number;
  quantity: number;
  total: number;
  note: string | null;
}

class OrderError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

const IDEM_SCOPE = "food";

const pkTime = (d: Date) => d.toLocaleString("en-PK", { timeZone: "Asia/Karachi", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export async function placeFoodOrder(input: unknown): Promise<ActionResult<PlacedFoodOrder>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!hasModule(tc, "restaurant")) return fail(rm("notAvailable", lang));
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  const tid = tc.tenant.id;
  const placed = (number: number, phone: string): PlacedFoodOrder => ({ number, token: orderToken("food", tid, number), phoneLast4: phone.slice(-4) });
  // honeypot filled → bot. Pretend success (number 0, no token) so nothing is created and nothing is learnt.
  if (d.website) return success(rm("orderReceived", lang), { number: 0, token: "", phoneLast4: "" });
  // suspended by the platform: the site layout shows a notice, but the action is callable directly, so refuse here too
  if (tc.tenant.status === "SUSPENDED") return fail(rm("storeUnavailable", lang));

  const ip = await clientIp();
  // CGNAT: many customers share one mobile-network IP, so the per-IP limit is generous; abuse is caught per phone.
  const rl = await rateLimit({ bucket: `foodorder:${ip}`, limit: 15, windowSec: 600, tenantId: tid });
  if (!rl.ok) return fail(rm("tooManyAttempts", lang));

  const rest = tc.settings.restaurant;
  if (!rest.acceptingOrders) return fail(rm("orderingPaused", lang));

  const phone = normalizePkPhone(d.phone);
  if (!phone) return fail(rm("fixFields", lang), { phone: rm("invalidPhone", lang) });
  const rlPhone = await rateLimit({ bucket: `foodorder:phone:${phone}`, limit: 10, windowSec: 3600, tenantId: tid });
  if (!rlPhone.ok) return fail(rm("tooManyAttempts", lang));

  /* duplicate-submit protection: same key → same order (FoodOrder.idempotencyKey is unique per tenant, see ecommerce/idempotency.ts) */
  const idem = d.idempotencyKey ?? null;
  const alreadyPlaced = (dup: { number: number; customerPhone: string }) => {
    // the key is per browser checkout; a different phone means the form was edited after the first attempt went through
    if (dup.customerPhone !== phone) return fail(rm("alreadySubmitted", lang));
    return success(rm("orderReceived", lang), placed(dup.number, phone));
  };
  if (idem) {
    const dup = await findOrderByIdempotencyKey(IDEM_SCOPE, tid, idem);
    if (dup) return alreadyPlaced(dup);
  }

  try {
    /* scheduling & opening hours */
    let scheduledFor: Date | null = null;
    if (d.scheduledFor) {
      const dt = new Date(d.scheduledFor);
      if (Number.isNaN(dt.getTime())) throw new OrderError(rm("invalidSchedule", lang), { scheduledFor: rm("invalidSchedule", lang) });
      const now = Date.now();
      if (dt.getTime() < now + 15 * 60_000) throw new OrderError(rm("scheduleTooSoon", lang), { scheduledFor: rm("scheduleTooSoon", lang) });
      if (dt.getTime() > now + 7 * 86_400_000) throw new OrderError(rm("scheduleTooFar", lang), { scheduledFor: rm("scheduleTooFar", lang) });
      // the kitchen must actually be open when the order is due
      if (isOpenAt(tc.settings.hours, dt) === false) throw new OrderError(rm("scheduleClosed", lang), { scheduledFor: rm("scheduleClosed", lang) });
      scheduledFor = dt;
    } else if (isOpenNow(tc.settings.hours) === false) {
      throw new OrderError(rm("closedNow", lang));
    }

    /* order type */
    if (d.type === "DELIVERY" && !rest.delivery) throw new OrderError(rm("deliveryUnavailable", lang));
    if (d.type === "PICKUP" && !rest.pickup) throw new OrderError(rm("pickupUnavailable", lang));
    if (d.type === "DINE_IN" && !rest.dineIn) throw new OrderError(rm("dineInUnavailable", lang));

    let deliveryFee = 0;
    let minOrder = 0;
    let area: string | null = null;
    let etaMins = 0;
    if (d.type === "DELIVERY") {
      if (!d.zoneId) throw new OrderError(rm("selectArea", lang), { zoneId: rm("required", lang) });
      const zone = await db.deliveryZone.findFirst({ where: { id: d.zoneId, tenantId: tid, isActive: true } });
      if (!zone) throw new OrderError(rm("areaUnavailable", lang), { zoneId: rm("areaUnavailable", lang) });
      if (!d.address || d.address.length < 8) throw new OrderError(rm("addressRequired", lang), { address: rm("required", lang) });
      deliveryFee = zone.fee;
      minOrder = zone.minOrder > 0 ? zone.minOrder : rest.minDeliveryOrder;
      area = zone.name;
      etaMins = zone.etaMins ?? 0;
    }
    if (d.type === "DINE_IN" && !d.tableNumber) throw new OrderError(rm("tableRequired", lang), { tableNumber: rm("required", lang) });

    /* re-price every line from the database (client prices are only a preview) */
    const ids = [...new Set(d.lines.map((l) => l.menuItemId))];
    const rows = await db.menuItem.findMany({ where: { tenantId: tid, id: { in: ids }, isAvailable: true }, include: itemInclude });
    const items = new Map(rows.map((r) => [r.id, toMenuItemDto(r)]));
    const priced: PricedLine[] = [];
    for (const line of d.lines) {
      const item = items.get(line.menuItemId);
      if (!item) throw new OrderError(rm("itemUnavailable", lang));
      const storedName = t(item.name, "en") || t(item.name, lang); // kitchen tickets are printed in English
      const shownName = t(item.name, lang) || storedName;
      let base = item.price;
      let sizeName: string | null = null;
      if (item.sizes.length) {
        const size = line.sizeName ? item.sizes.find((s) => s.name === line.sizeName) : item.sizes[0];
        if (!size) throw new OrderError(rm("selectSize", lang, { name: shownName }));
        base = size.price;
        sizeName = size.name;
      }
      const validIds = new Set(item.modifierGroups.flatMap((g) => g.modifiers.map((m) => m.id)));
      if (line.modifierIds.some((id) => !validIds.has(id))) throw new OrderError(rm("addonsUnavailable", lang, { name: shownName }));
      const chosen: OrderItemModifier[] = [];
      let extras = 0;
      for (const g of item.modifierGroups) {
        const selected = g.modifiers.filter((m) => line.modifierIds.includes(m.id));
        const min = g.required ? Math.max(1, g.minSelect) : g.minSelect;
        if (selected.length < min) throw new OrderError(rm("chooseAtLeast", lang, { n: min, group: t(g.name, lang), name: shownName }));
        if (selected.length > g.maxSelect) throw new OrderError(rm("chooseAtMost", lang, { n: g.maxSelect, group: t(g.name, lang), name: shownName }));
        for (const m of selected) {
          chosen.push({ name: t(m.name, "en") || t(m.name, lang), price: m.price });
          extras += m.price;
        }
      }
      const unitPrice = base + extras;
      priced.push({ menuItemId: item.id, name: storedName, sizeName, modifiers: chosen, unitPrice, quantity: line.qty, total: unitPrice * line.qty, note: line.note || null });
    }

    const subtotal = priced.reduce((s, l) => s + l.total, 0);
    if (d.type === "DELIVERY" && subtotal < minOrder) throw new OrderError(rm("minDelivery", lang, { area: area ?? "", amount: formatPKR(minOrder) }));
    const total = subtotal + deliveryFee;
    const estimatedMins = rest.prepTimeMins + (d.type === "DELIVERY" ? etaMins : 0);
    const timeline: TimelineEntry[] = [{ status: "NEW", at: new Date().toISOString() }];

    /* create order (retry if two orders race for the same number) */
    let created: { id: string; number: number } | null = null;
    for (let attempt = 0; attempt < 3 && !created; attempt++) {
      try {
        created = await db.$transaction(async (tx) => {
          const agg = await tx.foodOrder.aggregate({ where: { tenantId: tid }, _max: { number: true } });
          const number = (agg._max.number ?? 0) + 1;
          const customer = await tx.customer.upsert({
            where: { tenantId_phone: { tenantId: tid, phone } },
            create: { tenantId: tid, phone, name: d.name, address: d.address || null },
            update: { name: d.name, ...(d.address ? { address: d.address } : {}) },
          });
          return tx.foodOrder.create({
            data: {
              tenantId: tid,
              number,
              customerId: customer.id,
              type: d.type,
              customerName: d.name,
              customerPhone: phone,
              address: d.type === "DELIVERY" ? d.address || null : null,
              area,
              tableNumber: d.type === "DINE_IN" ? d.tableNumber || null : null,
              notes: d.notes || null,
              subtotal,
              deliveryFee,
              discount: 0,
              total,
              paymentMethod: "COD",
              status: "NEW",
              timeline: json(timeline),
              idempotencyKey: idem,
              scheduledFor,
              estimatedMins,
              ip,
              items: {
                create: priced.map((l) => ({
                  tenantId: tid,
                  menuItemId: l.menuItemId,
                  name: l.name,
                  sizeName: l.sizeName,
                  modifiers: json(l.modifiers),
                  unitPrice: l.unitPrice,
                  quantity: l.quantity,
                  total: l.total,
                  note: l.note,
                })),
              },
            },
            select: { id: true, number: true },
          });
        });
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
    if (!created) throw new Error("order number allocation failed");

    const itemLines = priced.map((l) => `${l.quantity} × ${l.name}${l.sizeName ? ` (${l.sizeName})` : ""}${l.modifiers.length ? ` + ${l.modifiers.map((m) => m.name).join(", ")}` : ""} — ${formatPKR(l.total)}`);
    notifyTenant(tc, {
      subject: `New ${d.type.replace("_", " ").toLowerCase()} order #${created.number} — ${formatPKR(total)} (${d.name})`,
      text: [
        `${d.name} · ${phone}`,
        `Reply on WhatsApp: ${replyWhatsAppLink(phone, `Assalam o Alaikum ${d.name}, this is ${tc.tenant.name} regarding your order #${created.number}.`) ?? phone}`,
        `Tracking link for the customer: https://${tc.host}/menu/order/${created.number}?t=${orderToken("food", tid, created.number)}`,
        `${d.type.replace("_", " ")}${area ? ` · ${area}` : ""}${d.tableNumber ? ` · Table ${d.tableNumber}` : ""}`,
        d.address ? d.address : "",
        scheduledFor ? `SCHEDULED for ${pkTime(scheduledFor)} (PKT)` : `Estimated ${estimatedMins} min`,
        "",
        ...itemLines,
        "",
        `Subtotal ${formatPKR(subtotal)} · Delivery ${formatPKR(deliveryFee)} · Total ${formatPKR(total)} (COD)`,
        d.notes ? `Notes: ${d.notes}` : "",
        "",
        `Open live board: https://${tc.host}/admin/kitchen`,
        `Order detail: https://${tc.host}/admin/food-orders/${created.id}`,
      ]
        .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
        .join("\n"),
    }).catch(() => undefined);

    revalidatePath("/", "layout");
    return success(rm("orderReceived", lang), placed(created.number, phone));
  } catch (e) {
    if (e instanceof OrderError) return fail(e.message, e.fieldErrors);
    log.error("food_order.place_failed", { tenantId: tid, ...errorFields(e) });
    return fail(rm("couldNotPlace", lang));
  }
}

/** Public order status polling, gated by the HMAC order token from the checkout redirect / lookup. */
export async function getFoodOrderStatus(
  number: number,
  token: string,
): Promise<ActionResult<{ status: FoodOrderStatusKey; timeline: TimelineEntry[]; estimatedMins: number | null; updatedAt: string }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!hasModule(tc, "restaurant")) return fail(rm("notAvailable", lang));
  const n = Number(number);
  if (tc.tenant.status === "SUSPENDED") return fail(rm("storeUnavailable", lang));
  if (!Number.isInteger(n) || n <= 0 || !verifyOrderToken("food", tc.tenant.id, n, token)) return fail(rm("invalidOrder", lang));
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `foodstatus:${ip}`, limit: 120, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail(rm("tooManyRequests", lang));
  const order = await db.foodOrder.findFirst({ where: { tenantId: tc.tenant.id, number: n }, select: { status: true, timeline: true, estimatedMins: true, updatedAt: true } });
  if (!order) return fail(rm("orderNotFound", lang));
  return success(undefined, { status: order.status, timeline: parseTimeline(order.timeline), estimatedMins: order.estimatedMins, updatedAt: order.updatedAt.toISOString() });
}

/**
 * Public lookup for customers who lost the tracking link: order number + the full phone used for the order → token.
 * Rate-limited per IP so the phone cannot be brute-forced against a known order number.
 */
export async function lookupFoodOrder(number: unknown, phone: unknown): Promise<ActionResult<{ number: number; token: string }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!hasModule(tc, "restaurant")) return fail(rm("notAvailable", lang));
  const n = parseInt(String(number ?? "").replace(/\D/g, ""), 10);
  const p = typeof phone === "string" ? normalizePkPhone(phone) : null;
  if (tc.tenant.status === "SUSPENDED") return fail(rm("storeUnavailable", lang));
  if (!Number.isFinite(n) || n <= 0) return fail(rm("enterOrderNumber", lang), { number: rm("enterOrderNumber", lang) });
  if (!p) return fail(rm("enterPhoneUsed", lang), { phone: rm("invalidPhone", lang) });
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `foodtrack:${ip}`, limit: 20, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail(rm("tooManyRequests", lang));
  const order = await db.foodOrder.findFirst({ where: { tenantId: tc.tenant.id, number: n, customerPhone: p }, select: { number: true } });
  if (!order) return fail(rm("orderNotFound", lang));
  return success(undefined, { number: order.number, token: orderToken("food", tc.tenant.id, order.number) });
}

/* ═══════════════════════════════ PUBLIC: RESERVATIONS ═══════════════════════════════ */

const reservationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(7, "Please enter a valid mobile number").max(20),
  guests: z.coerce.number().int().min(1, "At least 1 guest").max(50, "For parties over 50 please call us"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Please choose a time"),
  notes: z.string().trim().max(500).optional(),
  website: z.string().max(0).optional(),
});
export type ReservationInput = z.infer<typeof reservationSchema>;

export async function createReservation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  if (!hasModule(tc, "restaurant")) return fail(rm("notAvailable", lang));
  if (!tc.settings.restaurant.reservations) return fail(rm("reservationsOff", lang));
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (d.website) return success(rm("thankYou", lang), { id: "" });
  if (tc.tenant.status === "SUSPENDED") return fail(rm("storeUnavailable", lang));

  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `reservation:${ip}`, limit: 10, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail(rm("tooManyRequests", lang));

  const phone = normalizePkPhone(d.phone);
  if (!phone) return fail(rm("fixFields", lang), { phone: rm("invalidPhone", lang) });
  const rlPhone = await rateLimit({ bucket: `reservation:phone:${phone}`, limit: 5, windowSec: 3600, tenantId: tc.tenant.id });
  if (!rlPhone.ok) return fail(rm("tooManyRequests", lang));

  /* date + time are the customer's local (Pakistan) wall clock */
  const when = pkDateTime(d.date, d.time);
  if (!when) return fail(rm("fixFields", lang), { date: rm("invalidDate", lang) });
  const date = pkDateTime(d.date, "00:00")!;
  const now = new Date();
  const todayYmd = pkParts(now).ymd;
  if (d.date < todayYmd) return fail(rm("fixFields", lang), { date: rm("pastDate", lang) });
  if (when.getTime() < now.getTime()) return fail(rm("fixFields", lang), { time: rm("pastTime", lang) });
  if (when.getTime() < now.getTime() + 30 * 60_000) return fail(rm("fixFields", lang), { time: rm("tooSoon", lang) });
  if (when.getTime() > now.getTime() + 60 * 86_400_000) return fail(rm("fixFields", lang), { date: rm("tooFarAhead", lang) });
  const hours = tc.settings.hours;
  if (hours.length) {
    const day = hoursForDate(hours, when);
    if (!day || day.closed) return fail(rm("fixFields", lang), { date: rm("closedOnDay", lang) });
    if (isOpenAt(hours, when) === false) return fail(rm("fixFields", lang), { time: rm("outsideHours", lang, { open: day.open, close: day.close }) });
  }

  const row = await db.reservation.create({
    data: { tenantId: tc.tenant.id, name: d.name, phone, guests: d.guests, date, time: d.time, notes: d.notes || null, status: "PENDING" },
  });
  notifyTenant(tc, {
    subject: `Table reservation request — ${d.name}, ${d.guests} guest${d.guests === 1 ? "" : "s"} on ${d.date} ${d.time}`,
    text: [`${d.name} · ${phone}`, `Reply on WhatsApp: ${replyWhatsAppLink(phone, `Assalam o Alaikum ${d.name}, this is ${tc.tenant.name} regarding your table reservation for ${d.date} at ${d.time}.`) ?? phone}`, `${d.date} at ${d.time} · ${d.guests} guest${d.guests === 1 ? "" : "s"}`, d.notes ? `\n${d.notes}` : "", "", `Open admin: https://${tc.host}/admin/reservations`]
      .filter((l) => l !== "")
      .join("\n"),
  }).catch(() => undefined);
  revalidatePath("/", "layout");
  return success(rm("reservationReceived", lang), { id: row.id });
}

/* ═══════════════════════════════ ADMIN: LIVE BOARD & ORDERS ═══════════════════════════════ */

const foodStatusSchema = z.enum(FOOD_ORDER_STATUSES);

/** Orders in an active status, newest first, with items — used by the kitchen board polling. */
export async function listActiveOrders(): Promise<ActionResult<FoodOrderDto[]>> {
  try {
    const ctx = await requireTenantAdminAction();
    const rows = await db.foodOrder.findMany({
      where: { tenantId: ctx.tenant.id, status: { in: ACTIVE_FOOD_STATUSES } },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 200,
    });
    return success(undefined, rows.map(toFoodOrderDto));
  } catch (e) {
    return fail((e as Error).message);
  }
}

/**
 * Advance / cancel a food order. Transitions follow STATUS_TRANSITIONS; the write is guarded with
 * `updateMany where status = <status we read>` so two kitchen screens cannot both apply a stale transition.
 */
export async function updateFoodOrderStatus(id: string, status: string, note?: string): Promise<ActionResult<{ status: FoodOrderStatusKey }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = foodStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const order = await db.foodOrder.findFirst({ where: { id, tenantId: ctx.tenant.id } });
    if (!order) return fail("Order not found.");
    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(s.data)) return fail(`Cannot move an order from ${order.status.replace(/_/g, " ")} to ${s.data.replace(/_/g, " ")}.`);
    if (s.data === "OUT_FOR_DELIVERY" && order.type !== "DELIVERY") return fail("Only delivery orders can be marked out for delivery.");
    const cleanNote = note?.trim().slice(0, 300) || undefined;
    const timeline: TimelineEntry[] = [...parseTimeline(order.timeline), { status: s.data, at: new Date().toISOString(), ...(cleanNote ? { note: cleanNote } : {}) }];
    const r = await db.foodOrder.updateMany({ where: { id: order.id, tenantId: ctx.tenant.id, status: order.status }, data: { status: s.data, timeline: json(timeline) } });
    if (!r.count) return fail(`Order #${order.number} was just updated by someone else. Refresh to see its current status.`);
    await audit({
      tenantId: ctx.tenant.id,
      actorKind: "TENANT",
      actorId: ctx.user.id,
      actorName: ctx.user.name,
      action: "food_order.status",
      entity: "FoodOrder",
      entityId: order.id,
      meta: { number: order.number, from: order.status, to: s.data, note: cleanNote },
    });
    revalidatePath("/", "layout");
    return success(`Order #${order.number} → ${s.data.replace(/_/g, " ")}.`, { status: s.data });
  } catch (e) {
    return fail((e as Error).message);
  }
}

/** Pause / resume online ordering (settings.restaurant.acceptingOrders). */
export async function setAcceptingOrders(accepting: boolean): Promise<ActionResult<{ accepting: boolean }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const tenant = await db.tenant.findUnique({ where: { id: ctx.tenant.id }, select: { settings: true } });
    if (!tenant) return fail("Tenant not found.");
    const raw = tenant.settings && typeof tenant.settings === "object" && !Array.isArray(tenant.settings) ? (tenant.settings as Record<string, unknown>) : {};
    const current = parseSettings(raw);
    const merged = tenantSettingsSchema.parse({ ...current, restaurant: { ...current.restaurant, acceptingOrders: !!accepting } });
    await db.tenant.update({ where: { id: ctx.tenant.id }, data: { settings: json({ ...raw, ...merged }) } });
    await audit({
      tenantId: ctx.tenant.id,
      actorKind: "TENANT",
      actorId: ctx.user.id,
      actorName: ctx.user.name,
      action: accepting ? "restaurant.orders.resume" : "restaurant.orders.pause",
      entity: "Tenant",
      entityId: ctx.tenant.id,
    });
    revalidatePath("/", "layout");
    return success(accepting ? "Online ordering resumed." : "Online ordering paused.", { accepting: !!accepting });
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ ADMIN: MENU ITEMS ═══════════════════════════════ */

const optionalLocalized = z
  .object({ en: z.string().max(1000).default(""), ur: z.string().max(1000).optional() })
  .default({ en: "" });

const menuItemSchema = z.object({
  name: localizedString.extend({ en: z.string().trim().min(1, "Name is required").max(120) }),
  description: optionalLocalized,
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  categoryId: z.string().max(64).nullable().optional(),
  price: z.coerce.number().int().min(0, "Price cannot be negative"),
  sizes: menuSizesSchema.default([]),
  imageUrl: z.string().max(1000).optional().or(z.literal("")),
  tags: z.array(z.enum(MENU_TAGS)).max(MENU_TAGS.length).default([]),
  modifierGroupIds: z.array(z.string().max(64)).max(20).default([]),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;

export async function upsertMenuItem(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = menuItemSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const tid = ctx.tenant.id;

    const slug = slugify(d.slug || d.name.en);
    if (!slug) return fail("Please enter a valid name.", { slug: "Slug is required" });
    const clash = await db.menuItem.findFirst({ where: { tenantId: tid, slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
    if (clash) return fail("Another item already uses this URL slug.", { slug: "Already in use" });

    let categoryId: string | null = null;
    if (d.categoryId) {
      const cat = await db.menuCategory.findFirst({ where: { id: d.categoryId, tenantId: tid }, select: { id: true } });
      if (!cat) return fail("Category not found.", { categoryId: "Invalid category" });
      categoryId = cat.id;
    }
    const groupIds = [...new Set(d.modifierGroupIds)];
    if (groupIds.length) {
      const owned = await db.modifierGroup.count({ where: { tenantId: tid, id: { in: groupIds } } });
      if (owned !== groupIds.length) return fail("One of the modifier groups is invalid.");
    }
    const sizeNames = new Set(d.sizes.map((s) => s.name.toLowerCase()));
    if (sizeNames.size !== d.sizes.length) return fail("Size names must be unique.", { sizes: "Duplicate size names" });
    const price = d.sizes.length ? Math.min(...d.sizes.map((s) => s.price)) : d.price;

    const data = {
      slug,
      name: json(d.name),
      description: json(d.description),
      price,
      sizes: json(d.sizes),
      imageUrl: d.imageUrl || null,
      tags: d.tags,
      isAvailable: d.isAvailable,
      isFeatured: d.isFeatured,
      sortOrder: d.sortOrder,
      categoryId,
    };

    const row = await db.$transaction(async (tx) => {
      let item: { id: string };
      if (id) {
        const existing = await tx.menuItem.findFirst({ where: { id, tenantId: tid }, select: { id: true } });
        if (!existing) throw new Error("Item not found.");
        item = await tx.menuItem.update({ where: { id }, data, select: { id: true } });
        await tx.menuItemModifierGroup.deleteMany({ where: { menuItemId: id } });
      } else {
        item = await tx.menuItem.create({ data: { ...data, tenantId: tid }, select: { id: true } });
      }
      if (groupIds.length) await tx.menuItemModifierGroup.createMany({ data: groupIds.map((groupId) => ({ menuItemId: item.id, groupId })) });
      return item;
    });

    await audit({ tenantId: tid, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "menu_item.update" : "menu_item.create", entity: "MenuItem", entityId: row.id, meta: { slug } });
    revalidatePath("/", "layout");
    return success(id ? "Menu item updated." : "Menu item added.", { id: row.id });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Another item already uses this URL slug. Choose a different one.", { slug: "Already in use" });
    return fail((e as Error).message);
  }
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.menuItem.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "menu_item.delete", entity: "MenuItem", entityId: id });
    revalidatePath("/", "layout");
    return success("Menu item deleted. Past orders keep their line items.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleMenuItem(id: string, field: "available" | "featured", value: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (field !== "available" && field !== "featured") return fail("Invalid field.");
    const data = field === "available" ? { isAvailable: !!value } : { isFeatured: !!value };
    const { count } = await db.menuItem.updateMany({ where: { id, tenantId: ctx.tenant.id }, data });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: `menu_item.${field}`, entity: "MenuItem", entityId: id, meta: { value } });
    revalidatePath("/", "layout");
    if (field === "available") return success(value ? "Item is now available." : "Item marked unavailable (sold out).");
    return success(value ? "Item is now featured." : "Item removed from featured.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ ADMIN: MENU CATEGORIES ═══════════════════════════════ */

const menuCategorySchema = z.object({
  name: localizedString.extend({ en: z.string().trim().min(1, "Name is required").max(80) }),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  imageUrl: z.string().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
export type MenuCategoryInput = z.infer<typeof menuCategorySchema>;

export async function upsertMenuCategory(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = menuCategorySchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const tid = ctx.tenant.id;
    const slug = slugify(d.slug || d.name.en);
    if (!slug) return fail("Please enter a valid name.", { slug: "Slug is required" });
    const clash = await db.menuCategory.findFirst({ where: { tenantId: tid, slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
    if (clash) return fail("Another category already uses this slug.", { slug: "Already in use" });
    const data = { slug, name: json(d.name), imageUrl: d.imageUrl || null, isActive: d.isActive };
    let row: { id: string };
    if (id) {
      const existing = await db.menuCategory.findFirst({ where: { id, tenantId: tid }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.menuCategory.update({ where: { id }, data, select: { id: true } });
    } else {
      const count = await db.menuCategory.count({ where: { tenantId: tid } });
      row = await db.menuCategory.create({ data: { ...data, tenantId: tid, sortOrder: count }, select: { id: true } });
    }
    await audit({ tenantId: tid, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "menu_category.update" : "menu_category.create", entity: "MenuCategory", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Category updated." : "Category added.", { id: row.id });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Another category already uses this slug. Choose a different one.", { slug: "Already in use" });
    return fail((e as Error).message);
  }
}

export async function deleteMenuCategory(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.menuCategory.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "menu_category.delete", entity: "MenuCategory", entityId: id });
    revalidatePath("/", "layout");
    return success("Category deleted. Its items are now uncategorised.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

const idListSchema = z.array(z.string().max(64)).max(200);

export async function reorderMenuCategories(ids: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = idListSchema.safeParse(ids);
    if (!parsed.success) return fail("Invalid order.");
    await db.$transaction(parsed.data.map((id, i) => db.menuCategory.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { sortOrder: i } })));
    revalidatePath("/", "layout");
    return success("Order updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ ADMIN: MODIFIER GROUPS ═══════════════════════════════ */

const modifierRowSchema = z.object({
  id: z.string().max(64).optional().or(z.literal("")),
  name: localizedString.extend({ en: z.string().trim().min(1, "Name is required").max(80) }),
  price: z.coerce.number().int().min(0),
  isActive: z.boolean().default(true),
});

const modifierGroupSchema = z
  .object({
    name: localizedString.extend({ en: z.string().trim().min(1, "Name is required").max(80) }),
    minSelect: z.coerce.number().int().min(0).max(20).default(0),
    maxSelect: z.coerce.number().int().min(1).max(20).default(1),
    required: z.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    modifiers: z.array(modifierRowSchema).min(1, "Add at least one option").max(40),
  })
  .refine((g) => g.minSelect <= g.maxSelect, { message: "Minimum cannot exceed maximum", path: ["minSelect"] });
export type ModifierGroupInput = z.infer<typeof modifierGroupSchema>;

export async function upsertModifierGroup(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = modifierGroupSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const tid = ctx.tenant.id;
    const groupData = { name: json(d.name), minSelect: d.minSelect, maxSelect: d.maxSelect, required: d.required, sortOrder: d.sortOrder };

    const row = await db.$transaction(async (tx) => {
      let groupId: string;
      if (id) {
        const existing = await tx.modifierGroup.findFirst({ where: { id, tenantId: tid }, include: { modifiers: { select: { id: true } } } });
        if (!existing) throw new Error("Modifier group not found.");
        await tx.modifierGroup.update({ where: { id }, data: groupData });
        groupId = id;
        const existingIds = new Set(existing.modifiers.map((m) => m.id));
        const keep = new Set<string>();
        for (const [i, m] of d.modifiers.entries()) {
          const mData = { name: json(m.name), price: m.price, isActive: m.isActive, sortOrder: i };
          if (m.id && existingIds.has(m.id)) {
            await tx.modifier.update({ where: { id: m.id }, data: mData });
            keep.add(m.id);
          } else {
            const created = await tx.modifier.create({ data: { ...mData, tenantId: tid, groupId }, select: { id: true } });
            keep.add(created.id);
          }
        }
        const remove = [...existingIds].filter((x) => !keep.has(x));
        if (remove.length) await tx.modifier.deleteMany({ where: { tenantId: tid, groupId, id: { in: remove } } });
      } else {
        const created = await tx.modifierGroup.create({
          data: {
            ...groupData,
            tenantId: tid,
            modifiers: { create: d.modifiers.map((m, i) => ({ tenantId: tid, name: json(m.name), price: m.price, isActive: m.isActive, sortOrder: i })) },
          },
          select: { id: true },
        });
        groupId = created.id;
      }
      return { id: groupId };
    });

    await audit({ tenantId: tid, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "modifier_group.update" : "modifier_group.create", entity: "ModifierGroup", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Modifier group updated." : "Modifier group added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteModifierGroup(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.modifierGroup.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "modifier_group.delete", entity: "ModifierGroup", entityId: id });
    revalidatePath("/", "layout");
    return success("Modifier group deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ ADMIN: DELIVERY ZONES ═══════════════════════════════ */

const deliveryZoneSchema = z.object({
  name: z.string().trim().min(1, "Area name is required").max(80),
  fee: z.coerce.number().int().min(0),
  minOrder: z.coerce.number().int().min(0).default(0),
  etaMins: z.coerce.number().int().min(0).max(600).nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;

export async function upsertDeliveryZone(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = deliveryZoneSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const tid = ctx.tenant.id;
    const data = { name: d.name, fee: d.fee, minOrder: d.minOrder, etaMins: d.etaMins ?? null, isActive: d.isActive, sortOrder: d.sortOrder };
    let row: { id: string };
    if (id) {
      const existing = await db.deliveryZone.findFirst({ where: { id, tenantId: tid }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.deliveryZone.update({ where: { id }, data, select: { id: true } });
    } else {
      row = await db.deliveryZone.create({ data: { ...data, tenantId: tid }, select: { id: true } });
    }
    await audit({ tenantId: tid, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "delivery_zone.update" : "delivery_zone.create", entity: "DeliveryZone", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Delivery zone updated." : "Delivery zone added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteDeliveryZone(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.deliveryZone.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "delivery_zone.delete", entity: "DeliveryZone", entityId: id });
    revalidatePath("/", "layout");
    return success("Delivery zone deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ═══════════════════════════════ ADMIN: RESERVATIONS ═══════════════════════════════ */

const reservationStatusSchema = z.enum(RESERVATION_STATUSES);

/** Reservation transitions (see RESERVATION_TRANSITIONS); guarded so a stale screen cannot overwrite a newer change. */
export async function updateReservationStatus(id: string, status: string): Promise<ActionResult<{ status: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = reservationStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const row = await db.reservation.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true, status: true } });
    if (!row) return fail("Not found.");
    if (row.status === s.data) return success("No change.", { status: row.status });
    if (!canTransitionReservation(row.status, s.data)) {
      const allowed = RESERVATION_TRANSITIONS[row.status as keyof typeof RESERVATION_TRANSITIONS] ?? [];
      return fail(allowed.length ? `A ${row.status.toLowerCase()} reservation can only become: ${allowed.map((a) => a.toLowerCase()).join(", ")}.` : `A ${row.status.toLowerCase()} reservation is final.`);
    }
    const { count } = await db.reservation.updateMany({ where: { id, tenantId: ctx.tenant.id, status: row.status }, data: { status: s.data } });
    if (!count) return fail("This reservation was just updated by someone else. Refresh and try again.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "reservation.status", entity: "Reservation", entityId: id, meta: { from: row.status, to: s.data } });
    revalidatePath("/", "layout");
    return success(`Reservation ${s.data.toLowerCase()}.`, { status: s.data });
  } catch (e) {
    return fail((e as Error).message);
  }
}
