"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { localizedString } from "@/lib/i18n";
import { slugify } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

/** Slugs that would collide with built-in routes. */
const RESERVED = new Set(["admin", "api", "shop", "cart", "checkout", "order", "menu", "track", "jobs", "packages", "properties", "services", "team", "gallery", "contact", "blog", "p", "faq", "plans", "classes", "join", "quote", "consultation"]);

const pageSchema = z.object({
  title: localizedString.refine((v) => v.en.trim().length > 0, "Title is required"),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  content: localizedString.default({ en: "" }),
  showInNav: z.boolean().default(false),
  enabled: z.boolean().default(true),
  seo: z.object({ title: z.string().trim().max(70).optional().or(z.literal("")), description: z.string().trim().max(170).optional().or(z.literal("")) }).default({}),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type PageInput = z.infer<typeof pageSchema>;

async function uniqueSlug(tenantId: string, base: string, excludeId: string | null) {
  let root = slugify(base) || "page";
  if (RESERVED.has(root)) root = `${root}-page`;
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const clash = await db.sitePage.findFirst({ where: { tenantId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export async function upsertPage(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = pageSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    if (id) {
      const existing = await db.sitePage.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { id: true } });
      if (!existing) return fail("Not found.");
    }
    const seo = { ...(d.seo.title ? { title: d.seo.title } : {}), ...(d.seo.description ? { description: d.seo.description } : {}) };
    const data = {
      slug: await uniqueSlug(ctx.tenant.id, d.slug || d.title.en, id),
      title: json(d.title),
      content: json(d.content),
      showInNav: d.showInNav,
      enabled: d.enabled,
      seo: json(seo),
      sortOrder: d.sortOrder,
    };
    const row = id ? await db.sitePage.update({ where: { id }, data }) : await db.sitePage.create({ data: { ...data, tenantId: ctx.tenant.id } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "page.update" : "page.create", entity: "SitePage", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Page updated." : "Page created.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deletePage(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.sitePage.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "page.delete", entity: "SitePage", entityId: id });
    revalidatePath("/", "layout");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function togglePage(id: string, field: "enabled" | "showInNav", value: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.sitePage.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { [field]: value } });
    if (!count) return fail("Not found.");
    revalidatePath("/", "layout");
    return success(field === "enabled" ? (value ? "Page enabled." : "Page disabled.") : value ? "Added to navigation." : "Removed from navigation.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
