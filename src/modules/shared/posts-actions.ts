"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { localizedString } from "@/lib/i18n";
import { slugify } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const postSchema = z.object({
  title: localizedString.refine((v) => v.en.trim().length > 0, "Title is required"),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  excerpt: localizedString.default({ en: "" }),
  content: localizedString.default({ en: "" }),
  coverUrl: z.string().max(1000).optional().or(z.literal("")),
  published: z.boolean().default(false),
  /** ISO date (yyyy-mm-dd) or empty => now when publishing */
  publishedAt: z.string().max(30).optional().or(z.literal("")),
});
export type PostInput = z.infer<typeof postSchema>;

async function uniqueSlug(tenantId: string, base: string, excludeId: string | null) {
  const root = slugify(base) || "post";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const clash = await db.tenantPost.findFirst({ where: { tenantId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export async function upsertPost(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = postSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const existing = id ? await db.tenantPost.findFirst({ where: { id, tenantId: ctx.tenant.id } }) : null;
    if (id && !existing) return fail("Not found.");
    let publishedAt: Date | null = existing?.publishedAt ?? null;
    if (d.published) {
      const parsedDate = d.publishedAt ? new Date(d.publishedAt) : null;
      publishedAt = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : (publishedAt ?? new Date());
    }
    const data = {
      slug: await uniqueSlug(ctx.tenant.id, d.slug || d.title.en, id),
      title: json(d.title),
      excerpt: json(d.excerpt),
      content: json(d.content),
      coverUrl: d.coverUrl || null,
      published: d.published,
      publishedAt,
    };
    const row = id ? await db.tenantPost.update({ where: { id }, data }) : await db.tenantPost.create({ data: { ...data, tenantId: ctx.tenant.id } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: id ? "post.update" : "post.create", entity: "TenantPost", entityId: row.id });
    revalidatePath("/", "layout");
    return success(id ? "Post updated." : "Post created.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const { count } = await db.tenantPost.deleteMany({ where: { id, tenantId: ctx.tenant.id } });
    if (!count) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "post.delete", entity: "TenantPost", entityId: id });
    revalidatePath("/", "layout");
    return success("Deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function togglePostPublished(id: string, published: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const existing = await db.tenantPost.findFirst({ where: { id, tenantId: ctx.tenant.id }, select: { publishedAt: true } });
    if (!existing) return fail("Not found.");
    await db.tenantPost.update({ where: { id }, data: { published, publishedAt: published ? (existing.publishedAt ?? new Date()) : existing.publishedAt } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: published ? "post.publish" : "post.unpublish", entity: "TenantPost", entityId: id });
    revalidatePath("/", "layout");
    return success(published ? "Published." : "Moved to drafts.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
