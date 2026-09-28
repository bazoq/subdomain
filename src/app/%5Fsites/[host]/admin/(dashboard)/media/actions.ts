"use server";

import { z } from "zod";
import { db, dbErrorMessage } from "@/server/db";
import { requireTenantAdminAction } from "@/server/auth/guards";
import { deleteMedia, MediaError } from "@/server/storage/media";
import { audit } from "@/server/audit";
import { fail, success, type ActionResult } from "@/lib/action-result";

/**
 * Media library actions for the tenant admin. Every query is scoped to the session's tenant and to
 * confirmed PUBLIC files: private uploads (CVs, prescriptions) never get a browsable URL here.
 */

export type MediaRow = { id: string; url: string; mime: string; size: number; folder: string; alt: string | null; createdAt: string };
// "use server" modules may only export async functions; the page size is mirrored in media-library.tsx
const MEDIA_PAGE = 60;

const idSchema = z.string().regex(/^[a-z0-9]{1,64}$/i);
const listSchema = z.object({
  folder: z.string().regex(/^[a-z0-9_-]{1,32}$/).optional(),
  q: z.string().trim().max(80).optional(),
  cursor: idSchema.optional(),
});

function toRow(m: { id: string; url: string | null; mime: string; size: number; folder: string; alt: string | null; createdAt: Date }): MediaRow {
  return { id: m.id, url: m.url ?? "", mime: m.mime, size: m.size, folder: m.folder, alt: m.alt, createdAt: m.createdAt.toISOString() };
}

/** One page of the tenant's public images, newest first, optionally filtered by folder / search. */
export async function listMedia(input: { folder?: string; q?: string; cursor?: string }): Promise<ActionResult<{ rows: MediaRow[]; nextCursor?: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = listSchema.safeParse(input);
    if (!parsed.success) return fail("Invalid request.");
    const { folder, q, cursor } = parsed.data;
    const rows = await db.media.findMany({
      where: {
        tenantId: ctx.tenant.id,
        confirmed: true,
        visibility: "PUBLIC",
        url: { not: null },
        ...(folder ? { folder } : {}),
        ...(q ? { OR: [{ alt: { contains: q, mode: "insensitive" } }, { folder: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MEDIA_PAGE + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    const page = rows.slice(0, MEDIA_PAGE).filter((m) => m.url);
    return success(undefined, { rows: page.map(toRow), nextCursor: rows.length > MEDIA_PAGE ? page[page.length - 1]?.id : undefined });
  } catch (e) {
    return fail(dbErrorMessage(e));
  }
}

const altSchema = z.string().trim().max(200, "Keep the description under 200 characters");

/** Edit the alt text (accessibility description) of one of the tenant's images. */
export async function updateMediaAlt(id: string, alt: string): Promise<ActionResult<{ alt: string | null }>> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!idSchema.safeParse(id).success) return fail("Not found.");
    const parsed = altSchema.safeParse(alt);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid description.", { alt: parsed.error.issues[0]?.message ?? "Invalid" });
    const res = await db.media.updateMany({
      where: { id, tenantId: ctx.tenant.id, confirmed: true, visibility: "PUBLIC" },
      data: { alt: parsed.data || null },
    });
    if (res.count === 0) return fail("Not found.");
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "media.alt", entity: "Media", entityId: id });
    return success("Description saved.", { alt: parsed.data || null });
  } catch (e) {
    return fail(dbErrorMessage(e));
  }
}

/** Delete one of the tenant's files (object + row, quota released). Same rules as the API route. */
export async function deleteMediaAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    if (!idSchema.safeParse(id).success) return fail("Not found.");
    await deleteMedia({ kind: "TENANT", id: ctx.user.id, tenantId: ctx.tenant.id }, id);
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "media.delete", entity: "Media", entityId: id });
    return success("File deleted.");
  } catch (e) {
    if (e instanceof MediaError) return fail(e.message);
    return fail(dbErrorMessage(e));
  }
}
