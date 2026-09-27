"use server";

import { revalidatePath } from "next/cache";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { notifyNewLead } from "@/server/notify";
import { slugify } from "@/lib/utils";
import { t, type LocalizedString } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { publicFailure, publicFormGuard, publicMessages } from "@/modules/shared/public-form";
import { normalizeContactPhone, sanitizeLocalized, todayPk } from "@/modules/shared/validation";
import { bookingSchema, bookingStatusSchema, packageSchema } from "./schema";
import { ts } from "./strings";
import { parseDepartures } from "./helpers";
import { BOOKING_DUPLICATE_HOURS, BOOKING_MAX_DAYS_AHEAD, allowedBookingTransitions, canTransitionBooking, type BookingStatusKey } from "./constants";

/* ───────────────────────── public ───────────────────────── */

/**
 * Visitor requests a booking for an active package (JSON input from BookingForm).
 * tenant from host -> honeypot -> rate limit -> zod -> package active? -> date sanity
 * (not in the past, within 2 years, one of the published departures when any exist)
 * -> duplicate guard (same package + phone within 24h is idempotent) -> create -> owner notification.
 */
export async function createBooking(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const d = parsed.data;

  const guard = await publicFormGuard({ bucket: "booking", honeypot: d.website, limit: 5, windowSec: 3600 });
  if (!guard.ok) return guard.result;
  const { tc, lang } = guard;

  try {
    const phone = normalizeContactPhone(d.phone);
    if (!phone) return fail(t(publicMessages.fixFields, lang), { phone: t(publicMessages.invalidPhone, lang) });

    const pkg = await db.travelPackage.findFirst({ where: { id: d.packageId, tenantId: tc.tenant.id, isActive: true } });
    if (!pkg) return fail(t(ts.packageUnavailable, lang));

    let date: Date | null = null;
    if (d.date) {
      const today = todayPk();
      if (d.date < today) return fail(t(publicMessages.fixFields, lang), { date: t(ts.datePast, lang) });
      const parsedDate = new Date(`${d.date}T00:00:00Z`);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== d.date) return fail(t(publicMessages.fixFields, lang), { date: "Invalid date" });
      if (parsedDate.getTime() - Date.now() > BOOKING_MAX_DAYS_AHEAD * 86_400_000) return fail(t(publicMessages.fixFields, lang), { date: t(ts.dateTooFar, lang) });
      const departures = parseDepartures(pkg.departures, true);
      if (departures.length && !departures.includes(d.date)) return fail(t(publicMessages.fixFields, lang), { date: t(ts.dateNotDeparture, lang) });
      date = parsedDate;
    }

    // Duplicate guard: same phone for the same package within the window -> idempotent success.
    const since = new Date(Date.now() - BOOKING_DUPLICATE_HOURS * 3_600_000);
    const dup = await db.booking.findFirst({ where: { tenantId: tc.tenant.id, packageId: pkg.id, phone, createdAt: { gte: since } }, select: { id: true } });
    if (dup) return success(t(ts.alreadyBooked, lang), { id: dup.id });

    const booking = await db.booking.create({
      data: {
        tenantId: tc.tenant.id,
        packageId: pkg.id,
        name: d.name,
        phone,
        email: d.email || null,
        travellers: d.travellers,
        date,
        message: d.message || null,
      },
    });
    const title = t(pkg.title as LocalizedString, "en");
    void notifyNewLead(tc, {
      kind: "booking",
      id: booking.id,
      name: d.name,
      phone,
      email: d.email || null,
      packageTitle: title,
      destination: pkg.destination,
      pricePerPerson: pkg.price,
      travellers: d.travellers,
      date: d.date || null,
      message: d.message || null,
    });
    revalidatePath("/admin/bookings");
    return success(t(ts.booked, lang), { id: booking.id });
  } catch (e) {
    return publicFailure(lang, e);
  }
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
    const itinerary = v.itinerary.map((it, i) => ({ day: it.day > 0 ? it.day : i + 1, title: sanitizeLocalized(it.title), description: sanitizeLocalized(it.description) }));
    const data = {
      slug,
      title: json(sanitizeLocalized(v.title)),
      destination: v.destination,
      kind: v.kind,
      days: v.days,
      nights: v.nights,
      price: v.price,
      priceNote: v.priceNote || null,
      images: v.images.map((x) => x.trim()).filter(Boolean),
      summary: json(sanitizeLocalized(v.summary)),
      itinerary: json(itinerary),
      inclusions: json(v.inclusions.filter((x) => x.en.trim()).map(sanitizeLocalized)),
      exclusions: json(v.exclusions.filter((x) => x.en.trim()).map(sanitizeLocalized)),
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
    if (typeof value !== "boolean") return fail("Invalid value.");
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

/** Change a booking's status; transitions are validated against `canTransitionBooking`. */
export async function updateBookingStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const s = bookingStatusSchema.safeParse(status);
    if (!s.success) return fail("Invalid status.");
    const existing = await db.booking.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { status: true } });
    if (!existing) return fail("Not found.");
    const from = existing.status as BookingStatusKey;
    if (from === s.data) return success(`Booking is already ${from.toLowerCase()}.`);
    if (!canTransitionBooking(from, s.data)) {
      return fail(`Cannot move a ${from.toLowerCase()} booking to ${s.data.toLowerCase()}. Allowed: ${allowedBookingTransitions(from).join(", ")}.`);
    }
    await db.booking.update({ where: { id }, data: { status: s.data } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "booking.status", entity: "Booking", entityId: id, meta: { from, to: s.data } });
    revalidatePath("/admin/bookings");
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
