"use server";

/**
 * Restaurant module server actions: public ordering / reservations and tenant admin management.
 * Every query is scoped by the tenant resolved from the host (public) or the admin session (admin).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenant, currentLang } from "@/server/site";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { notifyTenant } from "@/server/notify";
import { isOpenNow } from "@/templates/ui";
import { parseSettings, tenantSettingsSchema } from "@/lib/tenant-settings";
import { localizedString, t } from "@/lib/i18n";
import { normalizePkPhone, slugify } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { itemInclude, toMenuItemDto } from "./queries";
import { toFoodOrderDto } from "./serialize";
import {
  ACTIVE_FOOD_STATUSES,
  FOOD_ORDER_STATUSES,
  FOOD_ORDER_TYPES,
  MENU_TAGS,
  RESERVATION_STATUSES,
  STATUS_TRANSITIONS,
  menuSizesSchema,
  parseTimeline,
  type FoodOrderDto,
  type FoodOrderStatusKey,
  type OrderItemModifier,
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

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}

export async function placeFoodOrder(input: unknown): Promise<ActionResult<{ number: number; phoneLast4: string }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  // bot: pretend success without creating anything
  if (d.website) return success("Order received.", { number: 0, phoneLast4: "0000" });

  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `foodorder:${ip}`, limit: 6, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many orders from this connection. Please wait a few minutes or call us.");

  const rest = tc.settings.restaurant;
  if (!rest.acceptingOrders) return fail(lang === "ur" ? "ہم اس وقت آن لائن آرڈر قبول نہیں کر رہے۔" : "We are not accepting online orders right now. Please call us.");

  const phone = normalizePkPhone(d.phone);
  if (!phone) return fail("Please enter a valid Pakistani mobile number.", { phone: "Invalid mobile number" });

  /* scheduling & opening hours */
  let scheduledFor: Date | null = null;
  if (d.scheduledFor) {
    const dt = new Date(d.scheduledFor);
    if (Number.isNaN(dt.getTime())) return fail("Invalid schedule time.", { scheduledFor: "Invalid date/time" });
    const now = Date.now();
    if (dt.getTime() < now + 15 * 60_000) return fail("Scheduled time must be at least 15 minutes from now.", { scheduledFor: "Too soon" });
    if (dt.getTime() > now + 7 * 86_400_000) return fail("Orders can be scheduled up to 7 days ahead.", { scheduledFor: "Too far ahead" });
    scheduledFor = dt;
  } else if (isOpenNow(tc.settings.hours) === false) {
    return fail(lang === "ur" ? "ہم اس وقت بند ہیں۔ آپ آرڈر بعد کے لیے شیڈول کر سکتے ہیں۔" : "We are closed right now. You can schedule your order for later.");
  }

  /* order type */
  if (d.type === "DELIVERY" && !rest.delivery) return fail("Delivery is not available.");
  if (d.type === "PICKUP" && !rest.pickup) return fail("Pickup is not available.");
  if (d.type === "DINE_IN" && !rest.dineIn) return fail("Dine-in ordering is not available.");

  let deliveryFee = 0;
  let minOrder = 0;
  let area: string | null = null;
  let etaMins = 0;
  if (d.type === "DELIVERY") {
    if (!d.zoneId) return fail("Please select your delivery area.", { zoneId: "Required" });
    const zone = await db.deliveryZone.findFirst({ where: { id: d.zoneId, tenantId: tc.tenant.id, isActive: true } });
    if (!zone) return fail("Selected delivery area is not available.", { zoneId: "Invalid area" });
    if (!d.address || d.address.length < 8) return fail("Please enter your complete delivery address.", { address: "Address is required" });
    deliveryFee = zone.fee;
    minOrder = zone.minOrder > 0 ? zone.minOrder : rest.minDeliveryOrder;
    area = zone.name;
    etaMins = zone.etaMins ?? 0;
  }
  if (d.type === "DINE_IN" && !d.tableNumber) return fail("Please enter your table number.", { tableNumber: "Required" });

  /* re-price every line from the database */
  const ids = [...new Set(d.lines.map((l) => l.menuItemId))];
  const rows = await db.menuItem.findMany({ where: { tenantId: tc.tenant.id, id: { in: ids }, isAvailable: true }, include: itemInclude });
  const items = new Map(rows.map((r) => [r.id, toMenuItemDto(r)]));
  const priced: PricedLine[] = [];
  for (const line of d.lines) {
    const item = items.get(line.menuItemId);
    if (!item) return fail("One of the items in your order is no longer available. Please review your order.");
    const itemName = t(item.name, "en");
    let base = item.price;
    let sizeName: string | null = null;
    if (item.sizes.length) {
      const size = line.sizeName ? item.sizes.find((s) => s.name === line.sizeName) : item.sizes[0];
      if (!size) return fail(`Please select a size for ${itemName}.`);
      base = size.price;
      sizeName = size.name;
    }
    const validIds = new Set(item.modifierGroups.flatMap((g) => g.modifiers.map((m) => m.id)));
    if (line.modifierIds.some((id) => !validIds.has(id))) return fail(`Some add-ons for ${itemName} are no longer available. Please re-add the item.`);
    const chosen: OrderItemModifier[] = [];
    let extras = 0;
    for (const g of item.modifierGroups) {
      const selected = g.modifiers.filter((m) => line.modifierIds.includes(m.id));
      const min = g.required ? Math.max(1, g.minSelect) : g.minSelect;
      if (selected.length < min) return fail(`Please choose at least ${min} option(s) for "${t(g.name, "en")}" on ${itemName}.`);
      if (selected.length > g.maxSelect) return fail(`You can choose at most ${g.maxSelect} option(s) for "${t(g.name, "en")}" on ${itemName}.`);
      for (const m of selected) {
        chosen.push({ name: t(m.name, "en"), price: m.price });
        extras += m.price;
      }
    }
    const unitPrice = base + extras;
    priced.push({
      menuItemId: item.id,
      name: itemName,
      sizeName,
      modifiers: chosen,
      unitPrice,
      quantity: line.qty,
      total: unitPrice * line.qty,
      note: line.note || null,
    });
  }

  const subtotal = priced.reduce((s, l) => s + l.total, 0);
  if (d.type === "DELIVERY" && subtotal < minOrder) return fail(`Minimum order for delivery to ${area} is Rs ${minOrder.toLocaleString("en-PK")}.`);
  const total = subtotal + deliveryFee;
  const estimatedMins = rest.prepTimeMins + (d.type === "DELIVERY" ? etaMins : 0);
  const timeline: TimelineEntry[] = [{ status: "NEW", at: new Date().toISOString() }];

  /* create order (retry once if two orders race for the same number) */
  let created: { id: string; number: number } | null = null;
  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    try {
      created = await db.$transaction(async (tx) => {
        const agg = await tx.foodOrder.aggregate({ where: { tenantId: tc.tenant.id }, _max: { number: true } });
        const number = (agg._max.number ?? 0) + 1;
        const customer = await tx.customer.upsert({
          where: { tenantId_phone: { tenantId: tc.tenant.id, phone } },
          create: { tenantId: tc.tenant.id, phone, name: d.name, address: d.address || null },
          update: { name: d.name, ...(d.address ? { address: d.address } : {}) },
        });
        const order = await tx.foodOrder.create({
          data: {
            tenantId: tc.tenant.id,
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
            scheduledFor,
            estimatedMins,
            ip,
            items: {
              create: priced.map((l) => ({
                tenantId: tc.tenant.id,
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
        return order;
      });
    } catch (e) {
      if (!isUniqueViolation(e) || attempt === 2) return fail("Could not place your order. Please try again or call us.");
    }
  }
  if (!created) return fail("Could not place your order. Please try again.");

  const itemLines = priced.map((l) => `${l.quantity} × ${l.name}${l.sizeName ? ` (${l.sizeName})` : ""}${l.modifiers.length ? ` + ${l.modifiers.map((m) => m.name).join(", ")}` : ""} — Rs ${l.total}`).join("\n");
  notifyTenant(tc, {
    subject: `New ${d.type.replace("_", " ").toLowerCase()} order #${created.number} — Rs ${total}`,
    text: `${d.name} (${phone})\n${d.type}${area ? ` · ${area}` : ""}${d.address ? `\n${d.address}` : ""}${d.tableNumber ? `\nTable ${d.tableNumber}` : ""}${scheduledFor ? `\nScheduled: ${scheduledFor.toISOString()}` : ""}\n\n${itemLines}\n\nSubtotal Rs ${subtotal} · Delivery Rs ${deliveryFee} · Total Rs ${total}\n${d.notes ? `\nNotes: ${d.notes}\n` : ""}\nOpen live board: /admin/kitchen`,
  }).catch(() => undefined);

  revalidatePath("/admin/kitchen");
  return success("Order received.", { number: created.number, phoneLast4: phone.slice(-4) });
}

/** Public order status lookup, gated by the last 4 digits of the customer's phone. */
export async function getFoodOrderStatus(
  number: number,
  phoneKey: string,
): Promise<ActionResult<{ status: FoodOrderStatusKey; timeline: TimelineEntry[]; estimatedMins: number | null; updatedAt: string }>> {
  const tc = await requireTenant();
  const n = Number(number);
  const key = String(phoneKey ?? "").replace(/\D/g, "").slice(-4);
  if (!Number.isInteger(n) || n <= 0 || key.length !== 4) return fail("Invalid order.");
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `foodstatus:${ip}`, limit: 120, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many requests.");
  const order = await db.foodOrder.findFirst({ where: { tenantId: tc.tenant.id, number: n }, select: { status: true, timeline: true, estimatedMins: true, updatedAt: true, customerPhone: true } });
  if (!order || order.customerPhone.replace(/\D/g, "").slice(-4) !== key) return fail("Order not found.");
  return success(undefined, { status: order.status, timeline: parseTimeline(order.timeline), estimatedMins: order.estimatedMins, updatedAt: order.updatedAt.toISOString() });
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
  if (!tc.settings.restaurant.reservations) return fail("Table reservations are not available online. Please call us.");
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (d.website) return success(lang === "ur" ? "شکریہ!" : "Thank you!", { id: "" });

  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `reservation:${ip}`, limit: 5, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many requests. Please try again later.");

  const phone = normalizePkPhone(d.phone);
  if (!phone) return fail("Please enter a valid Pakistani mobile number.", { phone: "Invalid mobile number" });
  const date = new Date(`${d.date}T00:00:00+05:00`);
  if (Number.isNaN(date.getTime())) return fail("Invalid date.", { date: "Invalid date" });
  const todayPk = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  todayPk.setHours(0, 0, 0, 0);
  if (date.getTime() < todayPk.getTime() - 5 * 3_600_000) return fail("Please choose today or a future date.", { date: "Date is in the past" });

  const row = await db.reservation.create({
    data: { tenantId: tc.tenant.id, name: d.name, phone, guests: d.guests, date, time: d.time, notes: d.notes || null, status: "PENDING" },
  });
  notifyTenant(tc, {
    subject: `Table reservation request — ${d.name}, ${d.guests} guests`,
    text: `${d.name} (${phone})\n${d.date} at ${d.time} · ${d.guests} guests\n${d.notes ?? ""}\n\nOpen admin: /admin/reservations`,
  }).catch(() => undefined);
  revalidatePath("/admin/reservations");
  return success(lang === "ur" ? "ریزرویشن کی درخواست موصول ہو گئی۔ ہم فون پر تصدیق کریں گے۔" : "Reservation request received. We will confirm by phone.", { id: row.id });
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
    await db.foodOrder.update({ where: { id: order.id }, data: { status: s.data, timeline: json(timeline) } });
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
    revalidatePath("/admin/kitchen");
    revalidatePath("/admin/food-orders");
    revalidatePath(`/admin/food-orders/${order.id}`);
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
    return success("Menu item deleted.");
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

export async function updateReservationStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = reservationStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const { count } = await db.reservation.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { status: s.data } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "reservation.status", entity: "Reservation", entityId: id, meta: { status: s.data } });
    revalidatePath("/admin/reservations");
    return success(`Reservation ${s.data.toLowerCase()}.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

