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

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
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

/** Build an object key. Never derived from user input beyond the extension whitelist. */
export function buildKey(scope: Scope, visibility: "public" | "private", ext: string) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const prefix = "tenantId" in scope ? `t/${scope.tenantId}` : "s";
  return `${prefix}/${visibility}/${yyyy}/${mm}/${nanoid(21)}.${ext}`;
}

/** Defensive check that a key belongs to a scope (used before any delete/read). */
export function keyBelongsTo(key: string, scope: Scope) {
  const prefix = "tenantId" in scope ? `t/${scope.tenantId}/` : "s/";
  return key.startsWith(prefix) && !key.includes("..");
}

export function publicUrlFor(key: string) {
  return `${env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
}

export async function presignPut(key: string, contentType: string, contentLength: number) {
  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(r2(), cmd, { expiresIn: 300 });
}

export async function presignGet(key: string, filename?: string, expiresIn = 60) {
  const cmd = new GetObjectCommand({
    Bucket: env.R2_BUCKET!,
    Key: key,
    ...(filename ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, "")}"` } : {}),
  });
  return getSignedUrl(r2(), cmd, { expiresIn });
}

export async function headObject(key: string) {
  try {
    const res = await r2().send(new HeadObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }));
    return { size: res.ContentLength ?? 0, contentType: res.ContentType ?? "" };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string) {
  await r2().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }));
}
