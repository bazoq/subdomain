"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { localizedString } from "@/lib/i18n";
import { slugify } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";
import { sanitizeLocalized, zImageUrlOrEmpty } from "@/modules/shared/validation";

const serviceSchema = z.object({
  name: localizedString.refine((v) => v.en.trim().length > 0, "Name is required"),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  summary: localizedString.default({ en: "" }),
  description: localizedString.default({ en: "" }),
  priceFrom: z.union([z.coerce.number().int().min(0).max(1_000_000_000), z.literal(""), z.null()]).optional(),
  priceNote: z.string().trim().max(120).optional().or(z.literal("")),
  imageUrl: zImageUrlOrEmpty,
  icon: z.string().trim().max(60).regex(/^[A-Za-z0-9_-]*$/, "Icon name only").optional().or(z.literal("")),
  features: z.array(localizedString).max(30).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

async function uniqueSlug(tenantId: string, base: string, excludeId: string | null) {
  const root = slugify(base) || "service";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const clash = await db.service.findFirst({ where: { tenantId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export async function upsertService(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const slug = await uniqueSlug(ctx.tenant.id, d.slug || d.name.en, id);
    const priceFrom = d.priceFrom === "" || d.priceFrom == null ? null : d.priceFrom;
    const data = {
      slug,
      name: json(sanitizeLocalized(d.name)),
      summary: json(sanitizeLocalized(d.summary)),
      description: json(sanitizeLocalized(d.description)),
      priceFrom,
      priceNote: d.priceNote || null,
      imageUrl: d.imageUrl?.trim() || null,
      icon: d.icon || null,
      features: json(d.features.filter((f) => f.en.trim()).map(sanitizeLocalized)),
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
    };
    let row;
    if (id) {
      const existing = await db.service.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.service.update({ where: { id }, data });
    } else {
      row = await db.service.create({ data: { ...data, tenantId: ctx.tenant.id } });
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "service.update" : "service.create", entity: "Service", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Service updated." : "Service added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteService(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.service.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "service.delete", entity: "Service", entityId: id });
    revalidatePath("/", "layout");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleService(id: string, field: "isActive" | "isFeatured", value: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (field !== "isActive" && field !== "isFeatured") return fail("Invalid field.");
    if (typeof value !== "boolean") return fail("Invalid value.");
    const { count } = await db.service.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { [field]: value } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: `service.${field}`, entity: "Service", entityId: id, meta: { value } });
    revalidatePath("/", "layout");
    return success(field === "isActive" ? (value ? "Shown on website." : "Hidden from website.") : value ? "Marked as featured." : "Removed from featured.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function reorderServices(ids: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = z.array(z.string()).max(500).safeParse(ids);
    if (!parsed.success) return fail("Invalid order.");
    await db.$transaction(parsed.data.map((id, i) => db.service.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { sortOrder: i } })));
    revalidatePath("/", "layout");
    return success("Order updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
