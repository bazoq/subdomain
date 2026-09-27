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

/**
 * Cloudflare R2 access. Tenant isolation is enforced here by construction:
 *  - keys are ALWAYS generated on the server with the tenant prefix `t/{tenantId}/…`
 *  - callers never pass raw keys from the client; they pass Media ids that are
 *    ownership-checked in the media service before reaching this module
 *  - presigned PUTs pin content-type and content-length; presigned GETs live 60 s
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
 * SVG can carry scripts; it is served from the R2 origin (not the tenant's), so the blast radius
 * is small, but it is still restricted to the platform owner (logos, icons).
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

export function publicUrlFor(key: string) {
  return `${env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
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
