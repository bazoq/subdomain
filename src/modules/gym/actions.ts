"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { hasModule, moduleUnavailable } from "@/modules/shared/module-gate";
import { audit } from "@/server/audit";
import { localizedString } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { sanitizeLocalized } from "@/modules/shared/validation";
import { PLAN_PERIODS, WEEKDAYS } from "@/modules/gym/constants";

/* ───────────────────────── plans ───────────────────────── */

const planSchema = z.object({
  name: localizedString.refine((v) => v.en.trim().length > 0, "Plan name is required"),
  price: z.coerce.number().int().min(0, "Price must be 0 or more").max(100_000_000),
  period: z.enum(PLAN_PERIODS).default("MONTH"),
  features: z.array(localizedString).max(30).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type PlanInput = z.infer<typeof planSchema>;

export async function upsertPlan(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!hasModule(ctx, "gym")) return moduleUnavailable();
    const parsed = planSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const data = {
      name: json(sanitizeLocalized(d.name)),
      price: d.price,
      period: d.period,
      features: json(d.features.filter((f) => f.en.trim()).map(sanitizeLocalized)),
      isPopular: d.isPopular,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
    };
    let row;
    if (id) {
      const existing = await db.membershipPlan.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.membershipPlan.update({ where: { id }, data });
    } else {
      row = await db.membershipPlan.create({ data: { ...data, tenantId: ctx.tenant.id } });
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "plan.update" : "plan.create", entity: "MembershipPlan", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Plan updated." : "Plan added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deletePlan(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!hasModule(ctx, "gym")) return moduleUnavailable();
    const { count } = await db.membershipPlan.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "plan.delete", entity: "MembershipPlan", entityId: id });
    revalidatePath("/", "layout");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function togglePlan(id: string, field: "isActive" | "isPopular", value: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!hasModule(ctx, "gym")) return moduleUnavailable();
    if (field !== "isActive" && field !== "isPopular") return fail("Invalid field.");
    if (typeof value !== "boolean") return fail("Invalid value.");
    const { count } = await db.membershipPlan.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { [field]: value } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: `plan.${field}`, entity: "MembershipPlan", entityId: id, meta: { value } });
    revalidatePath("/", "layout");
    return success(field === "isActive" ? (value ? "Shown on website." : "Hidden from website.") : value ? "Marked as popular." : "Popular badge removed.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* ───────────────────────── classes ───────────────────────── */

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");

const classSchema = z
  .object({
    name: localizedString.refine((v) => v.en.trim().length > 0, "Class name is required"),
    trainerId: z.string().max(64).optional().or(z.literal("")),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: time,
    endTime: time,
    capacity: z.union([z.coerce.number().int().min(1).max(1000), z.literal(""), z.null()]).optional(),
    level: z.string().trim().max(40).optional().or(z.literal("")),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.endTime > v.startTime, { message: "End time must be after start time", path: ["endTime"] });
export type ClassInput = z.infer<typeof classSchema>;

/** Two HH:MM ranges on the same day overlap when one starts before the other ends. */
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function upsertClass(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!hasModule(ctx, "gym")) return moduleUnavailable();
    const parsed = classSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    let trainerId: string | null = null;
    if (d.trainerId) {
      const tr = await db.teamMember.findFirst({ where: { id: d.trainerId, tenantId: ctx.tenant.id }, select: { id: true, name: true } });
      if (!tr) return fail("Trainer not found.", { trainerId: "Invalid trainer" });
      trainerId = tr.id;
      // A trainer cannot run two active classes at the same time on the same day.
      const sameDay = await db.classSchedule.findMany({
        where: { tenantId: ctx.tenant.id, trainerId, dayOfWeek: d.dayOfWeek, isActive: true, ...(id ? { NOT: { id } } : {}) },
        select: { id: true, name: true, startTime: true, endTime: true },
      });
      const clash = sameDay.find((c) => overlaps(d.startTime, d.endTime, c.startTime, c.endTime));
      if (clash && d.isActive) {
        const clashName = (clash.name as { en?: string } | null)?.en ?? "another class";
        const msg = `${tr.name} already has "${clashName}" ${clash.startTime}–${clash.endTime} on ${WEEKDAYS[d.dayOfWeek]}.`;
        return fail(msg, { trainerId: "Trainer is busy at this time", startTime: `Overlaps ${clash.startTime}–${clash.endTime}` });
      }
    }
    const data = {
      name: json(sanitizeLocalized(d.name)),
      trainerId,
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      capacity: d.capacity === "" || d.capacity == null ? null : d.capacity,
      level: d.level || null,
      isActive: d.isActive,
    };
    let row;
    if (id) {
      const existing = await db.classSchedule.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.classSchedule.update({ where: { id }, data });
    } else {
      row = await db.classSchedule.create({ data: { ...data, tenantId: ctx.tenant.id } });
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "class.update" : "class.create", entity: "ClassSchedule", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Class updated." : "Class added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteClass(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!hasModule(ctx, "gym")) return moduleUnavailable();
    const { count } = await db.classSchedule.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "class.delete", entity: "ClassSchedule", entityId: id });
    revalidatePath("/", "layout");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleClass(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!hasModule(ctx, "gym")) return moduleUnavailable();
    if (typeof isActive !== "boolean") return fail("Invalid value.");
    if (isActive) {
      // Re-activating must not create a trainer double-booking.
      const cls = await db.classSchedule.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { trainerId: true, dayOfWeek: true, startTime: true, endTime: true } });
      if (!cls) return fail("Not found.");
      if (cls.trainerId) {
        const clash = await db.classSchedule.findFirst({
          where: { tenantId: ctx.tenant.id, trainerId: cls.trainerId, dayOfWeek: cls.dayOfWeek, isActive: true, NOT: { id }, startTime: { lt: cls.endTime }, endTime: { gt: cls.startTime } },
          select: { startTime: true, endTime: true },
        });
        if (clash) return fail(`Cannot show this class: the trainer already has a class ${clash.startTime}–${clash.endTime} on ${WEEKDAYS[cls.dayOfWeek]}.`);
      }
    }
    const { count } = await db.classSchedule.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { isActive } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "class.isActive", entity: "ClassSchedule", entityId: id, meta: { value: isActive } });
    revalidatePath("/", "layout");
    return success(isActive ? "Class shown." : "Class hidden.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
