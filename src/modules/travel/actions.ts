"use server";

import { revalidatePath } from "next/cache";
import { db, json } from "@/server/db";
import { requireTenant, currentLang } from "@/server/site";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { notifyTenant } from "@/server/notify";
import { formatPKR, normalizePkPhone, slugify } from "@/lib/utils";
import { t, type LocalizedString } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { bookingSchema, bookingStatusSchema, packageSchema } from "./schema";
import { ts } from "./strings";

/* ───────────────────────── public ───────────────────────── */

/** Visitor requests a booking for an active package (JSON input from BookingForm). */
export async function createBooking(input: unknown): Promise<ActionResult<{ id: string }>> {
  const tc = await requireTenant();
  const lang = await currentLang();
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;
  if (d.website) return success(t(ts.booked, lang)); // honeypot

  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `booking:${ip}`, limit: 5, windowSec: 3600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many requests from this connection. Please try again later.");

  const pkg = await db.travelPackage.findFirst({ where: { id: d.packageId, tenantId: tc.tenant.id, isActive: true } });
  if (!pkg) return fail("This package is no longer available.");

  const phone = normalizePkPhone(d.phone) ?? d.phone;
  const booking = await db.booking.create({
    data: {
      tenantId: tc.tenant.id,
      packageId: pkg.id,
      name: d.name,
      phone,
      email: d.email || null,
      travellers: d.travellers,
      date: d.date ? new Date(d.date) : null,
      message: d.message || null,
    },
  });
  const title = t(pkg.title as LocalizedString, "en");
  notifyTenant(tc, {
    subject: `New booking request: ${title} — ${d.name}`,
    text: `${d.name} (${phone})${d.email ? ` · ${d.email}` : ""}\nPackage: ${title} · ${pkg.destination} · ${formatPKR(pkg.price)}\nTravellers: ${d.travellers}\nPreferred date: ${d.date || "flexible"}\n\n${d.message || ""}\n\nOpen admin: /admin/bookings`,
  }).catch(() => undefined);
  return success(t(ts.booked, lang), { id: booking.id });
}

/* ───────────────────────── admin: packages ───────────────────────── */

async function uniqueSlug(tenantId: string, base: string, excludeId: string | null): Promise<string> {
  const root = slugify(base) || "package";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const clash = await db.travelPackage.findFirst({ where: { tenantId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function upsertPackage(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = packageSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const v = parsed.data;
    const slug = await uniqueSlug(ctx.tenant.id, v.slug || v.title.en, id);
    const itinerary = v.itinerary.map((it, i) => ({ ...it, day: it.day > 0 ? it.day : i + 1 }));
    const data = {
      slug,
      title: json(v.title),
      destination: v.destination,
      kind: v.kind,
      days: v.days,
      nights: v.nights,
      price: v.price,
      priceNote: v.priceNote || null,
      images: v.images.filter(Boolean),
      summary: json(v.summary),
      itinerary: json(itinerary),
      inclusions: json(v.inclusions.filter((x) => x.en.trim())),
      exclusions: json(v.exclusions.filter((x) => x.en.trim())),
      departures: json(Array.from(new Set(v.departures)).sort()),
      isFeatured: v.isFeatured,
      isActive: v.isActive,
    };
    let row;
    if (id) {
      const existing = await db.travelPackage.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.travelPackage.update({ where: { id }, data });
    } else {
      const count = await db.travelPackage.count({ where: { tenantId: ctx.tenant.id } });
      row = await db.travelPackage.create({ data: { ...data, tenantId: ctx.tenant.id, sortOrder: count } });
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "package.update" : "package.create", entity: "TravelPackage", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Package updated." : "Package created.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deletePackage(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.travelPackage.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "package.delete", entity: "TravelPackage", entityId: id });
    revalidatePath("/", "layout");
    return success("Package deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function togglePackage(id: string, field: "isActive" | "isFeatured", value: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (field !== "isActive" && field !== "isFeatured") return fail("Invalid field.");
    const { count } = await db.travelPackage.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { [field]: value } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: `package.${field}`, entity: "TravelPackage", entityId: id, meta: { value } });
    revalidatePath("/", "layout");
    if (field === "isActive") return success(value ? "Package is now live." : "Package hidden from website.");
    return success(value ? "Marked as featured." : "Removed from featured.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ───────────────────────── admin: bookings ───────────────────────── */

export async function updateBookingStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = bookingStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const { count } = await db.booking.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { status: s.data } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "booking.status", entity: "Booking", entityId: id, meta: { status: s.data } });
    return success(`Booking marked ${s.data.toLowerCase()}.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.booking.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "booking.delete", entity: "Booking", entityId: id });
    revalidatePath("/admin/bookings");
    return success("Booking deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
