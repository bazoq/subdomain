import "server-only";
import { headers } from "next/headers";
import { db } from "@/server/db";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "0.0.0.0").split(",")[0].trim();
}

/**
 * Fixed-window rate limiter backed by Postgres (no Redis on this stack).
 * Returns { ok: false } when the bucket exceeded `limit` hits within `windowSec`.
 */
export async function rateLimit(opts: { bucket: string; limit: number; windowSec: number; tenantId?: string | null }) {
  const now = new Date();
  const tenantId = opts.tenantId ?? null;
  const existing = await db.rateLimit.findFirst({ where: { tenantId, bucket: opts.bucket } });
  if (!existing || existing.windowEnd < now) {
    const windowEnd = new Date(now.getTime() + opts.windowSec * 1000);
    if (existing) {
      await db.rateLimit.update({ where: { id: existing.id }, data: { hits: 1, windowEnd } });
    } else {
      await db.rateLimit.create({ data: { tenantId, bucket: opts.bucket, hits: 1, windowEnd } }).catch(() => undefined);
    }
    // opportunistic cleanup (cheap, indexed)
    if (Math.random() < 0.02) await db.rateLimit.deleteMany({ where: { windowEnd: { lt: now } } }).catch(() => undefined);
    return { ok: true, remaining: opts.limit - 1 };
  }
  if (existing.hits >= opts.limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((existing.windowEnd.getTime() - now.getTime()) / 1000) };
  }
  await db.rateLimit.update({ where: { id: existing.id }, data: { hits: { increment: 1 } } });
  return { ok: true, remaining: opts.limit - existing.hits - 1 };
}
