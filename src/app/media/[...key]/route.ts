import type { NextRequest } from "next/server";
import { r2Configured } from "@/config/env";
import { ALLOWED_DOCUMENT_TYPES, SUPER_ONLY_TYPES, getPublicObject, isPublicKey } from "@/server/storage/r2";
import { log, errorFields } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * GET /media/<key> — serves PUBLIC R2 objects (product/gallery images, logos) through the app, so the
 * bucket never needs public access or a custom domain (no R2_PUBLIC_URL). Only keys shaped like
 * `t/<tenant>/public/…` or `s/public/…` are served; private uploads (CVs, prescriptions, print files)
 * stay behind `/api/media/[id]` signed downloads.
 *
 * Keys are random and never reused, so responses are immutable: browsers and the Vercel CDN cache
 * them and R2 is read once per edge region. A deleted object may stay cached at the edge for up to
 * a day (`CDN-Cache-Control`). The sandboxing CSP stops an SVG opened directly from running script
 * on the platform origin. This path is excluded from the site-wide headers in next.config.ts.
 */

const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries({ ...ALLOWED_DOCUMENT_TYPES, ...SUPER_ONLY_TYPES }).map(([mime, ext]) => [ext, mime]),
);

const BASE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { ...BASE_HEADERS, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=60" },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.join("/");
  if (!r2Configured || !isPublicKey(key)) return notFound();

  let obj: Awaited<ReturnType<typeof getPublicObject>>;
  try {
    obj = await getPublicObject(key);
  } catch (err) {
    log.error("media.serve.failed", { key, ...errorFields(err) });
    return new Response("Storage unavailable", { status: 502, headers: { ...BASE_HEADERS, "Cache-Control": "no-store" } });
  }
  if (!obj) return notFound();

  // Trust the extension whitelist over whatever content-type the object carries.
  const ext = key.slice(key.lastIndexOf(".") + 1);
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const isImage = contentType.startsWith("image/");

  const headers: Record<string, string> = {
    ...BASE_HEADERS,
    "Content-Type": contentType,
    "Content-Disposition": isImage ? "inline" : "attachment",
    "Cache-Control": "public, max-age=31536000, immutable",
    "CDN-Cache-Control": "public, max-age=86400",
  };
  if (obj.size !== undefined) headers["Content-Length"] = String(obj.size);
  if (obj.etag) headers.ETag = obj.etag;

  return new Response(obj.body, { status: 200, headers });
}
