import "server-only";
import { db, isUniqueViolation } from "@/server/db";

/**
 * Duplicate-submit protection for public order placement.
 *
 * The client generates one random `idempotencyKey` per mounted checkout and sends it with every attempt. The key is
 * stored on the order row itself (`Order.idempotencyKey` / `FoodOrder.idempotencyKey`, `@@unique([tenantId, idempotencyKey])`,
 * migration 20260927182500_order_idempotency_key), so the database guarantees at most one order per key:
 *   - a retry after the first attempt succeeded finds that order by key and gets it back (no second order);
 *   - two concurrent submits with the same key race on the unique index; the loser's transaction rolls back (stock,
 *     coupon usage and customer upsert included) and the action re-reads the winner's order.
 * Nothing is written before the order row, so a failed attempt leaves nothing behind and the customer can simply retry.
 * (Until wave 4 this used lock rows in the RateLimit table; those are gone.)
 */

export type IdempotencyScope = "shop" | "food";

export interface ExistingOrder {
  id: string;
  number: number;
  customerPhone: string;
}

export function isIdempotencyKey(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(v);
}

/** The order already placed with this key for this tenant, if any. */
export async function findOrderByIdempotencyKey(scope: IdempotencyScope, tenantId: string, key: string): Promise<ExistingOrder | null> {
  const where = { tenantId_idempotencyKey: { tenantId, idempotencyKey: key } };
  const select = { id: true, number: true, customerPhone: true };
  return scope === "shop" ? db.order.findUnique({ where, select }) : db.foodOrder.findUnique({ where, select });
}

/**
 * True when an order create failed on the idempotency unique index (a concurrent submit with the same key won).
 * Drivers do not always report the violated columns, so callers should re-read by key on any P2002 before treating
 * the failure as the per-tenant order-number race.
 */
export function isIdempotencyConflict(e: unknown): boolean {
  return isUniqueViolation(e, "idempotencyKey");
}
