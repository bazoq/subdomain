import "server-only";
import { db } from "@/server/db";
import { Prisma } from "@/generated/prisma/client";

/**
 * Duplicate-submit protection for public order placement without a schema change.
 *
 * The client generates a random `idempotencyKey` per checkout session. We claim a row in `RateLimit`
 * (unique on tenantId + bucket) as a lock: `hits = 0` means "in flight", `hits = <order number>` means
 * "already placed". A retry with the same key therefore either waits, or gets the original order back,
 * instead of creating a second order. Rows expire with the normal rate-limit cleanup after 24h.
 */
const TTL_MS = 24 * 60 * 60 * 1000;

export type IdempotencyClaim = { state: "new" } | { state: "in_flight" } | { state: "done"; number: number };

export function isIdempotencyKey(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(v);
}

function bucketFor(scope: string, key: string) {
  return `idem:${scope}:${key}`;
}

export async function claimIdempotency(tenantId: string, scope: string, key: string): Promise<IdempotencyClaim> {
  const bucket = bucketFor(scope, key);
  try {
    await db.rateLimit.create({ data: { tenantId, bucket, hits: 0, windowEnd: new Date(Date.now() + TTL_MS) } });
    return { state: "new" };
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
  const existing = await db.rateLimit.findFirst({ where: { tenantId, bucket } });
  if (!existing) return { state: "new" };
  if (existing.windowEnd.getTime() < Date.now()) {
    // stale lock from an expired window: take it over
    await db.rateLimit.update({ where: { id: existing.id }, data: { hits: 0, windowEnd: new Date(Date.now() + TTL_MS) } });
    return { state: "new" };
  }
  if (existing.hits > 0) return { state: "done", number: existing.hits };
  return { state: "in_flight" };
}

/** Record the created order number against the key so retries return it. */
export async function completeIdempotency(tenantId: string, scope: string, key: string, number: number): Promise<void> {
  await db.rateLimit.updateMany({ where: { tenantId, bucket: bucketFor(scope, key) }, data: { hits: number } }).catch(() => undefined);
}

/** Release the lock when the attempt failed so the customer can fix the problem and retry. */
export async function releaseIdempotency(tenantId: string, scope: string, key: string): Promise<void> {
  await db.rateLimit.deleteMany({ where: { tenantId, bucket: bucketFor(scope, key), hits: 0 } }).catch(() => undefined);
}
