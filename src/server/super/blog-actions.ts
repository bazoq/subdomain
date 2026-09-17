"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireSuperAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { getCategory } from "@/lib/categories";
import { slugify } from "@/lib/utils";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const blogPostSchema = z.object({
  category: z.string().min(1, "Choose a category"),
  title: z.string().trim().min(3, "Title is required").max(160),
  slug: z.string().trim().min(3, "Slug is required").max(120),
  excerpt: z.string().trim().min(1, "Excerpt is required").max(400),
  content: z.string().max(200_000).default(""),
  coverUrl: z.string().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  published: z.boolean().default(false),
  publishedAt: z.string().optional().or(z.literal("")),
  authorName: z.string().trim().min(1).max(80).default("SiteForge Team"),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export async function upsertBlogPost(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireSuperAction();
    const parsed = blogPostSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    if (d.category !== "general" && !getCategory(d.category)) return fail("Unknown category.", { category: "Unknown category." });
    const slug = slugify(d.slug);
    if (!slug) return fail("Invalid slug.", { slug: "Slug must contain letters or digits." });

    const clash = await db.blogPost.findUnique({ where: { category_slug: { category: d.category, slug } }, select: { id: true } });
    if (clash && clash.id !== id) return fail("A post with this slug already exists in this category.", { slug: "Already in use." });

    let publishedAt: Date | null = null;
    if (d.published) {
      const parsedDate = d.publishedAt ? new Date(d.publishedAt) : new Date();
      publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    const data = {
      category: d.category,
      slug,
      title: d.title,
      excerpt: d.excerpt,
      content: d.content,
      coverUrl: d.coverUrl || null,
      tags: Array.from(new Set(d.tags.map((t) => t.toLowerCase()))),
      published: d.published,
      publishedAt,
      authorName: d.authorName,
    };
    let row;
    if (id) {
      const existing = await db.blogPost.findUnique({ where: { id }, select: { id: true, publishedAt: true } });
      if (!existing) return fail("Post not found.");
      // keep the original publish date when re-saving an already published post without an explicit date
      if (d.published && !d.publishedAt && existing.publishedAt) data.publishedAt = existing.publishedAt;
      row = await db.blogPost.update({ where: { id }, data });
    } else {
      row = await db.blogPost.create({ data });
    }
    await audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, action: id ? "blog.update" : "blog.create", entity: "BlogPost", entityId: row.id, meta: { category: row.category, slug: row.slug } });
    revalidatePath("/", "layout");
    return success(id ? "Post updated." : "Post created.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  try {
    const user = await requireSuperAction();
    const { count } = await db.blogPost.deleteMany({ where: { id } });
    if (!count) return fail("Post not found.");
    await audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, action: "blog.delete", entity: "BlogPost", entityId: id });
    revalidatePath("/", "layout");
    return success("Post deleted.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
