import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { env, r2Configured } from "@/config/env";
import { rootUrl } from "@/config/site";

/**
 * Cloudflare R2 access. Tenant isolation is enforced here by construction:
 *  - keys are ALWAYS generated on the server with the tenant prefix `t/{tenantId}/…`
 *  - callers never pass raw keys from the client; they pass Media ids that are
 *    ownership-checked in the media service before reaching this module
 *  - presigned PUTs pin content-type and content-length; presigned GETs live 60 s
 *  - the bucket stays private: PUBLIC objects are served by the app at `/media/<key>`
 *    (src/app/media/[...key]/route.ts), so no public bucket URL / custom domain is needed
 */

let client: S3Client | null = null;

export function r2() {
  if (!r2Configured) throw new Error("Cloudflare R2 is not configured (R2_* env vars missing).");
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

/** Raster images anyone (tenant staff, visitors) may upload. */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * SVG can carry scripts. `/media/*` responses carry a sandboxing CSP so an SVG opened directly
 * cannot run script on the platform origin, but uploads are still restricted to the platform owner.
 */
export const SUPER_ONLY_TYPES: Record<string, string> = {
  "image/svg+xml": "svg",
};

export const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/zip": "zip",
  "application/postscript": "ai",
  "image/vnd.adobe.photoshop": "psd",
  ...ALLOWED_IMAGE_TYPES,
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25 MB

export type Scope = { tenantId: string } | { platform: true };

/** Normalise a client-supplied MIME type: lowercase, no parameters, bounded. */
export function normaliseMime(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase().slice(0, 100);
}

/** Build an object key. Never derived from user input beyond the extension whitelist. */
export function buildKey(scope: Scope, visibility: "public" | "private", ext: string) {
  if (!/^[a-z0-9]{1,8}$/.test(ext)) throw new Error("invalid extension");
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const prefix = "tenantId" in scope ? `t/${scope.tenantId}` : "s";
  return `${prefix}/${visibility}/${yyyy}/${mm}/${nanoid(21)}.${ext}`;
}

/** Defensive check that a key belongs to a scope (used before any delete/read). */
export function keyBelongsTo(key: string, scope: Scope) {
  const prefix = "tenantId" in scope ? `t/${scope.tenantId}/` : "s/";
  return key.startsWith(prefix) && !key.includes("..") && !key.includes("//");
}

/** Shape of a key produced by `buildKey(scope, "public", ext)`. Private keys never match. */
const PUBLIC_KEY_RE = /^(?:t\/[A-Za-z0-9_-]{1,64}|s)\/public\/\d{4}\/\d{2}\/[A-Za-z0-9_-]{21}\.[a-z0-9]{1,8}$/;

/** True only for well-formed PUBLIC object keys: the one thing `/media/*` may serve. */
export function isPublicKey(key: string) {
  return PUBLIC_KEY_RE.test(key);
}

/**
 * Absolute URL of a PUBLIC object, served through the app on the platform root host
 * (`https://ROOT_DOMAIN/media/<key>`). Absolute so it works on every tenant host and custom
 * domain and stays usable in OG images / JSON-LD.
 */
export function publicUrlFor(key: string) {
  return rootUrl(`/media/${key}`);
}

/**
 * Header-safe download filename. Strips directories, control characters (CR/LF header
 * injection), quotes, backslashes and semicolons; collapses whitespace; caps the length while
 * keeping the extension. Returns an ASCII form for `filename=` and a UTF-8 form for `filename*=`.
 */
export function safeFilename(name: string, fallback: string): { ascii: string; utf8: string } {
  let base = name.replace(/[\\/]+/g, "/").split("/").pop() ?? "";
  base = Array.from(base)
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return c >= 0x20 && c !== 0x7f && !'"\\;'.includes(ch);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
  if (!base) base = fallback;
  if (base.length > 100) {
    const dot = base.lastIndexOf(".");
    const ext = dot > 0 && base.length - dot <= 8 ? base.slice(dot) : "";
    base = `${base.slice(0, 100 - ext.length)}${ext}`;
  }
  const ascii = base.replace(/[^\x20-\x7e]/g, "_");
  return { ascii, utf8: encodeRFC5987(base) };
}

function encodeRFC5987(s: string) {
  return encodeURIComponent(s).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export async function presignPut(key: string, contentType: string, contentLength: number) {
  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  // Content-Type and Content-Length are part of the signature: the browser must send exactly these.
  return getSignedUrl(r2(), cmd, { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) });
}

export async function presignGet(key: string, filename?: string, expiresIn = 60) {
  const fallback = key.split("/").pop() ?? "download";
  const { ascii, utf8 } = safeFilename(filename ?? fallback, fallback);
  const cmd = new GetObjectCommand({
    Bucket: env.R2_BUCKET!,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`,
  });
  return getSignedUrl(r2(), cmd, { expiresIn });
}

/** Read a PUBLIC object for `/media/*`. Null when the key is not public or the object does not exist. */
export async function getPublicObject(key: string) {
  if (!isPublicKey(key)) return null;
  try {
    const res = await r2().send(new GetObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }));
    if (!res.Body) return null;
    return {
      body: res.Body.transformToWebStream(),
      size: res.ContentLength,
      etag: res.ETag,
    };
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw err;
  }
}

export async function headObject(key: string) {
  try {
    const res = await r2().send(new HeadObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }));
    return { size: res.ContentLength ?? 0, contentType: normaliseMime(res.ContentType ?? "") };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string) {
  await r2().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }));
}
