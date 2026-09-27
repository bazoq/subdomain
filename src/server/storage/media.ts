import "server-only";
import { db } from "@/server/db";
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  SUPER_ONLY_TYPES,
  buildKey,
  deleteObject,
  headObject,
  keyBelongsTo,
  normaliseMime,
  presignGet,
  presignPut,
  publicUrlFor,
  type Scope,
} from "@/server/storage/r2";
import { hmacHex, timingSafeEqualHex } from "@/server/auth/hmac";
import { r2Configured } from "@/config/env";
import { log, errorFields } from "@/lib/log";

/**
 * Media service: the only path from a browser to an R2 object.
 *
 *  presign  -> validate actor, tenant status, type, size, quota; reserve a Media row (unconfirmed);
 *              return a 5-minute presigned PUT plus a confirm token (HMAC of the media id)
 *  confirm  -> ownership check (+ token for anonymous visitors); HEAD the object; size and
 *              content-type must match what was reserved; mark confirmed; charge the quota
 *  download -> ownership check; 60-second presigned GET with a sanitised filename
 *  purge    -> rows never confirmed within an hour are deleted with their objects
 */

export type Actor = { kind: "SUPER"; id: string } | { kind: "TENANT"; id: string; tenantId: string } | { kind: "PUBLIC"; tenantId: string };

export class MediaError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "MediaError";
  }
}

const UNCONFIRMED_TTL_MS = 60 * 60 * 1000;

function scopeFor(actor: Actor, tenantIdOverride?: string): Scope {
  if (actor.kind === "SUPER") return tenantIdOverride ? { tenantId: tenantIdOverride } : { platform: true };
  return { tenantId: actor.tenantId };
}

/** MIME types this actor may upload: SVG is reserved for the platform owner. */
function allowedTypes(actor: Actor): Record<string, string> {
  return actor.kind === "SUPER" ? { ...ALLOWED_DOCUMENT_TYPES, ...SUPER_ONLY_TYPES } : ALLOWED_DOCUMENT_TYPES;
}

function confirmToken(mediaId: string) {
  return hmacHex("media-confirm", mediaId);
}

async function assertTenantUsable(tenantId: string | null, actor: Actor) {
  if (!tenantId || actor.kind === "SUPER") return;
  const t = await db.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
  if (!t) throw new MediaError("Tenant not found.", 404);
  if (t.status === "SUSPENDED") throw new MediaError("This website is suspended.", 403);
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
  const mime = normaliseMime(input.mime);
  const types = allowedTypes(actor);
  const ext = types[mime];
  if (!ext) throw new MediaError("File type not allowed.");
  const isImage = mime in ALLOWED_IMAGE_TYPES || mime in SUPER_ONLY_TYPES;
  const max = isImage ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > max) {
    throw new MediaError(`File too large (max ${Math.round(max / 1024 / 1024)} MB).`);
  }
  if (actor.kind === "PUBLIC" && input.visibility !== "PRIVATE") throw new MediaError("Not allowed.", 403);
  if (!/^[a-z0-9_-]{1,32}$/.test(input.folder)) throw new MediaError("Invalid folder.");
  if (actor.kind !== "SUPER" && input.tenantId && input.tenantId !== actor.tenantId) throw new MediaError("Not allowed.", 403);

  const scope = scopeFor(actor, input.tenantId);
  const tenantId = "tenantId" in scope ? scope.tenantId : null;

  if (tenantId) {
    const t = await db.tenant.findUnique({ where: { id: tenantId }, select: { status: true, storageUsed: true, storageQuota: true } });
    if (!t) throw new MediaError("Tenant not found.", 404);
    if (t.status === "SUSPENDED" && actor.kind !== "SUPER") throw new MediaError("This website is suspended.", 403);
    if (t.storageUsed + BigInt(input.size) > t.storageQuota) throw new MediaError("Storage quota exceeded.", 413);
  }

  const key = buildKey(scope, input.visibility === "PUBLIC" ? "public" : "private", ext);
  const media = await db.media.create({
    data: {
      tenantId,
      key,
      url: input.visibility === "PUBLIC" ? publicUrlFor(key) : null,
      visibility: input.visibility,
      mime,
      size: input.size,
      folder: input.folder,
      alt: input.alt?.slice(0, 200),
      confirmed: false,
      createdBy: actor.kind === "PUBLIC" ? "public" : actor.id,
    },
  });
  const [uploadUrl, token] = await Promise.all([presignPut(key, mime, input.size), confirmToken(media.id)]);
  if (Math.random() < 0.02) purgeUnconfirmedMedia().catch(() => undefined);
  return { mediaId: media.id, uploadUrl, url: media.url, token };
}

/**
 * Step 2: after the browser PUT succeeds, verify the object exists and matches the reservation,
 * then mark confirmed. Anonymous visitors must present the confirm token from step 1, so one
 * visitor cannot confirm (or probe) another visitor's pending upload.
 */
export async function confirmUpload(actor: Actor, mediaId: string, token?: string) {
  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new MediaError("Not found.", 404);
  assertOwnership(actor, media.tenantId, media.key);
  if (actor.kind === "PUBLIC") {
    if (media.createdBy !== "public" || media.visibility !== "PRIVATE") throw new MediaError("Not allowed.", 403);
    if (!token || !/^[a-f0-9]{64}$/.test(token) || !timingSafeEqualHex(token, await confirmToken(media.id))) throw new MediaError("Not allowed.", 403);
  }
  await assertTenantUsable(media.tenantId, actor);
  if (media.confirmed) return media;

  const head = await headObject(media.key);
  if (!head) throw new MediaError("Upload not found in storage.", 409);
  const mismatch = head.size !== media.size ? "size" : head.contentType !== normaliseMime(media.mime) ? "type" : null;
  if (mismatch) {
    await deleteObject(media.key).catch(() => undefined);
    await db.media.delete({ where: { id: media.id } }).catch(() => undefined);
    throw new MediaError(mismatch === "size" ? "Uploaded size mismatch." : "Uploaded file type mismatch.", 409);
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
  await assertTenantUsable(media.tenantId, actor);
  return presignGet(media.key, filename ?? `${media.id}.${media.key.split(".").pop()}`);
}

export async function deleteMedia(actor: Actor, mediaId: string) {
  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) return;
  if (actor.kind === "PUBLIC") throw new MediaError("Not allowed.", 403);
  assertOwnership(actor, media.tenantId, media.key);
  await assertTenantUsable(media.tenantId, actor);
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
    take: Math.min(opts.take ?? 60, 200),
    ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
  });
}

/**
 * Maintenance: delete Media rows that were reserved but never confirmed within the TTL, together
 * with any object that did get uploaded. Safe to run concurrently; bounded per call.
 */
export async function purgeUnconfirmedMedia(opts: { olderThanMs?: number; batch?: number } = {}): Promise<number> {
  const cutoff = new Date(Date.now() - (opts.olderThanMs ?? UNCONFIRMED_TTL_MS));
  const rows = await db.media.findMany({
    where: { confirmed: false, createdAt: { lt: cutoff } },
    select: { id: true, key: true },
    take: Math.min(opts.batch ?? 200, 1000),
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) return 0;
  if (r2Configured) {
    await Promise.allSettled(rows.map((r) => deleteObject(r.key)));
  }
  const res = await db.media.deleteMany({ where: { id: { in: rows.map((r) => r.id) }, confirmed: false } });
  if (res.count) log.info("media.purged", { count: res.count });
  return res.count;
}

/** Wrap for callers that must never throw (opportunistic maintenance). */
export async function safePurgeUnconfirmedMedia() {
  try {
    return await purgeUnconfirmedMedia();
  } catch (err) {
    log.error("media.purge.failed", errorFields(err));
    return 0;
  }
}
