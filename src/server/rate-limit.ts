import "server-only";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { log, errorFields } from "@/lib/log";

const IP_RE = /^[0-9a-f.:]{3,45}$/i;

/**
 * Best-effort client IP. Vercel rewrites `x-forwarded-for` to the real client address; behind
 * any other proxy the first hop is what that proxy reports. Values that do not look like an IP
 * collapse to "unknown" so bucket keys stay bounded and injection-free.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const raw = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim();
  return IP_RE.test(raw) ? raw.toLowerCase() : "unknown";
}

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec?: number; degraded?: true };

const BUCKET_MAX = 120;

/**
 * Fixed-window rate limiter backed by Postgres (no Redis on this stack).
 *
 * Atomicity: the hit counter is advanced with a single `UPDATE ... SET hits = hits + 1 RETURNING`
 * (Prisma `increment`), so concurrent requests can never both observe "one left" and both pass.
 * The window reset is a conditional update (`WHERE id = ? AND windowEnd < now`), so only one
 * racer resets the window; the others fall through to the atomic increment.
 *
 * Availability: if the database is unreachable the limiter FAILS OPEN — a login or contact form
 * must not go down with the limiter — but every such decision is logged as `ratelimit.degraded`.
 */
export async function rateLimit(opts: { bucket: string; limit: number; windowSec: number; tenantId?: string | null }): Promise<RateLimitResult> {
  const now = new Date();
  const tenantId = opts.tenantId ?? null;
  const bucket = opts.bucket.slice(0, BUCKET_MAX);
  const limit = Math.max(1, Math.floor(opts.limit));
  const windowEnd = new Date(now.getTime() + opts.windowSec * 1000);

  try {
    const existing = await db.rateLimit.findFirst({ where: { tenantId, bucket }, select: { id: true, hits: true, windowEnd: true } });

    if (!existing) {
      try {
        await db.rateLimit.create({ data: { tenantId, bucket, hits: 1, windowEnd } });
        // opportunistic cleanup (cheap, indexed)
        if (Math.random() < 0.02) await db.rateLimit.deleteMany({ where: { windowEnd: { lt: now } } }).catch(() => undefined);
        return { ok: true, remaining: limit - 1 };
      } catch {
        // lost a create race: another request inserted the row first — count against it below
        const raced = await db.rateLimit.findFirst({ where: { tenantId, bucket }, select: { id: true, hits: true, windowEnd: true } });
        if (!raced) return { ok: true, remaining: limit - 1 };
        return await increment(raced.id, limit);
      }
    }

    if (existing.windowEnd < now) {
      // Window expired: conditional reset. If someone else reset it first (P2025), just count.
      try {
        await db.rateLimit.update({ where: { id: existing.id, windowEnd: { lt: now } }, data: { hits: 1, windowEnd } });
        return { ok: true, remaining: limit - 1 };
      } catch (err) {
        if ((err as { code?: string }).code !== "P2025") throw err;
      }
    }

    return await increment(existing.id, limit);
  } catch (err) {
    log.error("ratelimit.degraded", { bucket, tenantId, ...errorFields(err) });
    return { ok: true, remaining: limit - 1, degraded: true };
  }
}

async function increment(id: string, limit: number): Promise<RateLimitResult> {
  const row = await db.rateLimit.update({ where: { id }, data: { hits: { increment: 1 } }, select: { hits: true, windowEnd: true } });
  if (row.hits > limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((row.windowEnd.getTime() - Date.now()) / 1000)) };
  }
  return { ok: true, remaining: limit - row.hits };
}

/** Maintenance: drop expired windows. */
export async function purgeExpiredRateLimits(): Promise<number> {
  const res = await db.rateLimit.deleteMany({ where: { windowEnd: { lt: new Date() } } });
  return res.count;
}
