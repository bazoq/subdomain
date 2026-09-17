"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { localizedString } from "@/lib/i18n";
import { normalizePkPhone, slugify } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const url = z.string().trim().max(300).optional().or(z.literal(""));

const memberSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  role: localizedString.default({ en: "" }),
  bio: localizedString.default({ en: "" }),
  imageUrl: z.string().max(1000).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(120).optional().or(z.literal("")),
  socials: z.object({ facebook: url, instagram: url, linkedin: url, twitter: url, youtube: url, tiktok: url }).partial().default({}),
  specialties: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type TeamMemberInput = z.infer<typeof memberSchema>;

async function uniqueSlug(tenantId: string, base: string, excludeId: string | null) {
  const root = slugify(base) || "member";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const clash = await db.teamMember.findFirst({ where: { tenantId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export async function upsertTeamMember(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = memberSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const socials = Object.fromEntries(Object.entries(d.socials).filter(([, v]) => v && v.trim()));
    const data = {
      slug: await uniqueSlug(ctx.tenant.id, d.slug || d.name, id),
      name: d.name,
      role: json(d.role),
      bio: json(d.bio),
      imageUrl: d.imageUrl || null,
      phone: d.phone ? (normalizePkPhone(d.phone) ?? d.phone) : null,
      email: d.email || null,
      socials: json(socials),
      specialties: Array.from(new Set(d.specialties)),
      isActive: d.isActive,
      sortOrder: d.sortOrder,
    };
    let row;
    if (id) {
      const existing = await db.teamMember.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
      row = await db.teamMember.update({ where: { id }, data });
    } else {
      row = await db.teamMember.create({ data: { ...data, tenantId: ctx.tenant.id } });
    }
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "team.update" : "team.create", entity: "TeamMember", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Member updated." : "Member added.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteTeamMember(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.teamMember.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await db.classSchedule.updateMany({ where: { tenantId: ctx.tenant.id, trainerId: id }, data: { trainerId: null } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "team.delete", entity: "TeamMember", entityId: id });
    revalidatePath("/", "layout");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleTeamMember(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.teamMember.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { isActive } });
    if (!count) return fail("Not found.");
    revalidatePath("/", "layout");
    return success(isActive ? "Shown on website." : "Hidden from website.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function reorderTeam(ids: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = z.array(z.string()).max(500).safeParse(ids);
    if (!parsed.success) return fail("Invalid order.");
    await db.$transaction(parsed.data.map((id, i) => db.teamMember.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { sortOrder: i } })));
    revalidatePath("/", "layout");
    return success("Order updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
