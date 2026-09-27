"use server";

/**
 * REFERENCE IMPLEMENTATION of an admin CRUD with server actions.
 * Copy this pattern for every other entity.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { localizedString } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { sanitizeLocalized, zImageUrlOrEmpty } from "@/modules/shared/validation";

const testimonialSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  role: z.string().trim().max(80).optional().or(z.literal("")),
  text: localizedString.refine((v) => v.en.trim().length > 0, { message: "Review text is required", path: ["en"] }).refine((v) => v.en.length <= 2000 && (v.ur ?? "").length <= 2000, { message: "Keep the review under 2000 characters", path: ["en"] }),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  imageUrl: zImageUrlOrEmpty,
  isActive: z.boolean().default(true),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export async function upsertTestimonial(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = testimonialSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const data = {
      name: parsed.data.name,
      role: parsed.data.role || null,
      text: json(sanitizeLocalized(parsed.data.text)),
      rating: parsed.data.rating,
      imageUrl: parsed.data.imageUrl?.trim() || null,
      isActive: parsed.data.isActive,
    };
    let row;
    if (id) {
      const existing = await db.testimonial.findFirst({ where: { id, tenantId: ctx.tenant.id } });
      if (!existing) return fail("Not found.");
      row = await db.testimonial.update({ where: { id }, data });
    } else {
      const count = await db.testimonial.count({ where: { tenantId: ctx.tenant.id } });
      row = await db.testimonial.create({ data: { ...data, tenantId: ctx.tenant.id, sortOrder: count } });
    }
    await audit({
      tenantId: ctx.tenant.id,
      actorKind: "TENANT",
      actorId: ctx.user.id,
      actorName: ctx.user.name,
      action: id ? "testimonial.update" : "testimonial.create",
      entity: "Testimonial",
      entityId: row.id,
    });
    revalidatePath("/", "layout");
    return success(id ? "Testimonial updated." : "Testimonial added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.testimonial.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "testimonial.delete", entity: "Testimonial", entityId: id });
    revalidatePath("/", "layout");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleTestimonial(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (typeof isActive !== "boolean") return fail("Invalid value.");
    const { count } = await db.testimonial.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { isActive } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "testimonial.isActive", entity: "Testimonial", entityId: id, meta: { value: isActive } });
    revalidatePath("/", "layout");
    return success(isActive ? "Shown on website." : "Hidden from website.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
