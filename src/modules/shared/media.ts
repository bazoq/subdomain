import "server-only";
import { db } from "@/server/db";
import { deleteObject, keyBelongsTo } from "@/server/storage/r2";
import { errorFields, log } from "@/lib/log";

/**
 * Remove a PRIVATE upload (CV, prescription, quote file) that belongs to `tenantId`.
 * Used by module actions when the owning row is deleted or replaced so R2 never
 * accumulates orphaned objects. Best effort: never throws, returns whether a row was removed.
 */
export async function deleteTenantPrivateMedia(tenantId: string, mediaId: string | null | undefined): Promise<boolean> {
  if (!mediaId) return false;
  try {
    const media = await db.media.findFirst({ where: { id: mediaId, tenantId, visibility: "PRIVATE" } });
    if (!media || !keyBelongsTo(media.key, { tenantId })) return false;
    await deleteObject(media.key).catch(() => undefined);
    await db.$transaction([
      db.media.delete({ where: { id: media.id } }),
      ...(media.confirmed ? [db.tenant.update({ where: { id: tenantId }, data: { storageUsed: { decrement: media.size } } })] : []),
    ]);
    return true;
  } catch (err) {
    log.error("media.delete_private_failed", { tenantId, mediaId, ...errorFields(err) });
    return false;
  }
}

/**
 * Verify that a visitor-supplied media id is a confirmed PRIVATE upload for this tenant
 * with an allowed mime type (and optionally folder). Returns the row or null.
 */
export async function findPrivateUpload(tenantId: string, mediaId: string, opts: { mimes?: readonly string[]; folder?: string } = {}) {
  const media = await db.media.findFirst({
    where: {
      id: mediaId,
      tenantId,
      visibility: "PRIVATE",
      confirmed: true,
      ...(opts.mimes?.length ? { mime: { in: [...opts.mimes] } } : {}),
      ...(opts.folder ? { folder: opts.folder } : {}),
    },
    select: { id: true, mime: true, size: true, folder: true },
  });
  return media;
}
