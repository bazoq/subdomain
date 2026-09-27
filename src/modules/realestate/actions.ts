"use server";

import { revalidatePath } from "next/cache";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { slugify } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { sanitizeLocalized } from "@/modules/shared/validation";
import { propertySchema } from "./schema";

/* Public inquiries go through submitLead (formKey "property_inquiry") — see ui/inquiry-form.tsx. */

async function uniqueSlug(tenantId: string, base: string, excludeId: string | null): Promise<string> {
  const root = slugify(base) || "property";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const clash = await db.property.findFirst({ where: { tenantId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function upsertProperty(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = propertySchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const v = parsed.data;
    let agentId: string | null = null;
    if (v.agentId) {
      const agent = await db.teamMember.findFirst({ where: { id: v.agentId, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!agent) return fail("Selected agent not found.", { agentId: "Choose a valid agent" });
      agentId = agent.id;
    }
    const slug = await uniqueSlug(ctx.tenant.id, v.slug || v.title.en, id);
    const data = {
      slug,
      title: json(sanitizeLocalized(v.title)),
      purpose: v.purpose,
      type: v.type,
      price: v.price,
      priceUnit: v.purpose === "RENT" && v.priceUnit === "TOTAL" ? "MONTHLY" : v.priceUnit,
      areaValue: v.areaValue,
      areaUnit: v.areaUnit,
      bedrooms: v.type === "PLOT" ? null : v.bedrooms,
      bathrooms: v.type === "PLOT" ? null : v.bathrooms,
      city: v.city,
      location: v.location,
      description: json(sanitizeLocalized(v.description)),
      features: Array.from(new Set(v.features.map((x) => x.trim()).filter(Boolean))),
      images: v.images.map((x) => x.trim()).filter(Boolean),
      videoUrl: v.videoUrl.trim() || null,
      mapUrl: v.mapUrl.trim() || null,
      agentId,
      isFeatured: v.isFeatured,
      isActive: v.isActive,
    };
    let row;
    if (id) {
      const existing = await db.property.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.property.update({ where: { id }, data });
    } else {
      const count = await db.property.count({ where: { tenantId: ctx.tenant.id } });
      row = await db.property.create({ data: { ...data, tenantId: ctx.tenant.id, sortOrder: count } });
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "property.update" : "property.create", entity: "Property", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Property updated." : "Property listed.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.property.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "property.delete", entity: "Property", entityId: id });
    revalidatePath("/", "layout");
    return success("Property deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleProperty(id: string, field: "isActive" | "isFeatured", value: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (field !== "isActive" && field !== "isFeatured") return fail("Invalid field.");
    if (typeof value !== "boolean") return fail("Invalid value.");
    const { count } = await db.property.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { [field]: value } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: `property.${field}`, entity: "Property", entityId: id, meta: { value } });
    revalidatePath("/", "layout");
    if (field === "isActive") return success(value ? "Listing is now live." : "Listing hidden from website.");
    return success(value ? "Marked as featured." : "Removed from featured.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
