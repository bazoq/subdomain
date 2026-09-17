"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, json } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { audit } from "@/server/audit";
import { localizedString } from "@/lib/i18n";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const album = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]{1,40}$/, "Album name: letters, numbers, dashes only")
  .default("general");

const addSchema = z.object({ album, urls: z.array(z.string().max(1000)).min(1, "Upload at least one image").max(40) });

/** Create one GalleryItem per uploaded public URL. */
export async function addGalleryImages(input: unknown): Promise<ActionResult<{ count: number }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = addSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const start = await db.galleryItem.count({ where: { tenantId: ctx.tenant.id, album: parsed.data.album } });
    await db.galleryItem.createMany({
      data: parsed.data.urls.map((imageUrl, i) => ({ tenantId: ctx.tenant.id, imageUrl, album: parsed.data.album, caption: {}, sortOrder: start + i })),
    });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "gallery.add", entity: "GalleryItem", meta: { album: parsed.data.album, count: parsed.data.urls.length } });
    revalidatePath("/", "layout");
    return success(`${parsed.data.urls.length} image(s) added.`, { count: parsed.data.urls.length });
  } catch (e) {
    return fail((e as Error).message);
  }
}

const updateSchema = z.object({ caption: localizedString.default({ en: "" }), album });

export async function updateGalleryItem(id: string, input: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const { count } = await db.galleryItem.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { caption: json(parsed.data.caption), album: parsed.data.album } });
    if (!count) return fail("Not found.");
    revalidatePath("/", "layout");
    return success("Saved.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteGalleryItems(ids: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = z.array(z.string()).min(1).max(200).safeParse(ids);
    if (!parsed.success) return fail("Nothing selected.");
    const { count } = await db.galleryItem.deleteMany({ where: { id: { in: parsed.data }, tenantId: ctx.tenant.id } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "gallery.delete", entity: "GalleryItem", meta: { count } });
    revalidatePath("/", "layout");
    return success(`${count} image(s) removed.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

/** Rename an album (moves every item) or move selected items to another album. */
export async function moveGalleryItems(input: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = z.object({ ids: z.array(z.string()).max(500).optional(), fromAlbum: z.string().max(40).optional(), toAlbum: album }).safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const { ids, fromAlbum, toAlbum } = parsed.data;
    if (!ids?.length && !fromAlbum) return fail("Nothing to move.");
    const { count } = await db.galleryItem.updateMany({
      where: { tenantId: ctx.tenant.id, ...(ids?.length ? { id: { in: ids } } : { album: fromAlbum }) },
      data: { album: toAlbum },
    });
    revalidatePath("/", "layout");
    return success(`${count} image(s) moved to "${toAlbum}".`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function reorderGallery(ids: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = z.array(z.string()).max(500).safeParse(ids);
    if (!parsed.success) return fail("Invalid order.");
    await db.$transaction(parsed.data.map((id, i) => db.galleryItem.updateMany({ where: { id, tenantId: ctx.tenant.id }, data: { sortOrder: i } })));
    revalidatePath("/", "layout");
    return success("Order updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
