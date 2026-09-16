import "server-only";
import { db } from "@/server/db";
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  buildKey,
  deleteObject,
  headObject,
  keyBelongsTo,
  presignGet,
  presignPut,
  publicUrlFor,
  type Scope,
} from "@/server/storage/r2";
import { r2Configured } from "@/config/env";

export type Actor = { kind: "SUPER"; id: string } | { kind: "TENANT"; id: string; tenantId: string } | { kind: "PUBLIC"; tenantId: string };

export class MediaError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function scopeFor(actor: Actor, tenantIdOverride?: string): Scope {
  if (actor.kind === "SUPER") return tenantIdOverride ? { tenantId: tenantIdOverride } : { platform: true };
  return { tenantId: actor.tenantId };
}

/**
 * Step 1 of an upload: validate, reserve a Media row, hand back a presigned PUT.
 * Public visitors (job applicants, prescription uploads, quote files) may only
 * create PRIVATE documents for the tenant of the host they are on.
 */
export async function requestUpload(
  actor: Actor,
  input: { mime: string; size: number; visibility: "PUBLIC" | "PRIVATE"; folder: string; tenantId?: string; alt?: string },
) {
  if (!r2Configured) throw new MediaError("File storage is not configured on this server.", 503);
  const isImage = input.mime in ALLOWED_IMAGE_TYPES;
  const isDoc = input.mime in ALLOWED_DOCUMENT_TYPES;
  if (!isImage && !isDoc) throw new MediaError("File type not allowed.");
  const max = isImage ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (input.size <= 0 || input.size > max) throw new MediaError(`File too large (max ${Math.round(max / 1024 / 1024)} MB).`);
  if (actor.kind === "PUBLIC" && input.visibility !== "PRIVATE") throw new MediaError("Not allowed.", 403);
  if (!/^[a-z0-9_-]{1,32}$/.test(input.folder)) throw new MediaError("Invalid folder.");

  const scope = scopeFor(actor, input.tenantId);
  const tenantId = "tenantId" in scope ? scope.tenantId : null;

  if (tenantId) {
    const t = await db.tenant.findUnique({ where: { id: tenantId }, select: { storageUsed: true, storageQuota: true } });
    if (!t) throw new MediaError("Tenant not found.", 404);
    if (t.storageUsed + BigInt(input.size) > t.storageQuota) throw new MediaError("Storage quota exceeded.", 413);
  }

  const ext = ALLOWED_DOCUMENT_TYPES[input.mime];
  const key = buildKey(scope, input.visibility === "PUBLIC" ? "public" : "private", ext);
  const media = await db.media.create({
    data: {
      tenantId,
      key,
      url: input.visibility === "PUBLIC" ? publicUrlFor(key) : null,
      visibility: input.visibility,
      mime: input.mime,
      size: input.size,
      folder: input.folder,
      alt: input.alt?.slice(0, 200),
      confirmed: false,
      createdBy: actor.kind === "PUBLIC" ? "public" : actor.id,
    },
  });
  const uploadUrl = await presignPut(key, input.mime, input.size);
  return { mediaId: media.id, uploadUrl, url: media.url };
}

/** Step 2: after the browser PUT succeeds, verify the object exists and mark confirmed. */
export async function confirmUpload(actor: Actor, mediaId: string) {
  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new MediaError("Not found.", 404);
  assertOwnership(actor, media.tenantId, media.key);
  if (media.confirmed) return media;
  const head = await headObject(media.key);
  if (!head) throw new MediaError("Upload not found in storage.", 409);
  if (head.size !== media.size) {
    await deleteObject(media.key).catch(() => undefined);
    await db.media.delete({ where: { id: media.id } });
    throw new MediaError("Uploaded size mismatch.", 409);
  }
  const [updated] = await db.$transaction([
    db.media.update({ where: { id: media.id }, data: { confirmed: true } }),
    ...(media.tenantId
      ? [db.tenant.update({ where: { id: media.tenantId }, data: { storageUsed: { increment: media.size } } })]
      : []),
  ]);
  return updated;
}

/** Short-lived signed download for a PRIVATE file (or any file) with ownership check. */
export async function signedDownloadUrl(actor: Actor, mediaId: string, filename?: string) {
  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media || !media.confirmed) throw new MediaError("Not found.", 404);
  if (actor.kind === "PUBLIC") throw new MediaError("Not allowed.", 403);
  assertOwnership(actor, media.tenantId, media.key);
  return presignGet(media.key, filename ?? `${media.id}.${media.key.split(".").pop()}`);
}

export async function deleteMedia(actor: Actor, mediaId: string) {
  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) return;
  if (actor.kind === "PUBLIC") throw new MediaError("Not allowed.", 403);
  assertOwnership(actor, media.tenantId, media.key);
  await deleteObject(media.key).catch(() => undefined);
  await db.$transaction([
    db.media.delete({ where: { id: media.id } }),
    ...(media.tenantId && media.confirmed
      ? [db.tenant.update({ where: { id: media.tenantId }, data: { storageUsed: { decrement: media.size } } })]
      : []),
  ]);
}

function assertOwnership(actor: Actor, mediaTenantId: string | null, key: string) {
  if (actor.kind === "SUPER") return; // platform owner may manage every file
  if (!mediaTenantId || mediaTenantId !== actor.tenantId) throw new MediaError("Not allowed.", 403);
  if (!keyBelongsTo(key, { tenantId: actor.tenantId })) throw new MediaError("Not allowed.", 403);
}

export async function listTenantMedia(tenantId: string, opts: { folder?: string; take?: number; cursor?: string } = {}) {
  return db.media.findMany({
    where: { tenantId, confirmed: true, visibility: "PUBLIC", ...(opts.folder ? { folder: opts.folder } : {}) },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 60,
    ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
  });
}
