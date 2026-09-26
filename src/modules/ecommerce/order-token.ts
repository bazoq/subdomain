import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";

/**
 * Non-guessable access token for public order pages (`/order/[n]?t=…`, `/menu/order/[n]?t=…`).
 *
 * Order numbers are sequential per tenant, so a URL that only carries the number (or the last 4 digits
 * of the phone) could be enumerated to read other customers' names, phones and addresses. The token is an
 * HMAC over (kind, tenantId, number) with SESSION_SECRET, so it can only be obtained from the checkout
 * response or by proving knowledge of the full phone number through the tracker action.
 */
export type OrderTokenKind = "shop" | "food";

export function orderToken(kind: OrderTokenKind, tenantId: string, number: number): string {
  return createHmac("sha256", env.SESSION_SECRET).update(`${kind}:${tenantId}:${number}`).digest("base64url").slice(0, 24);
}

export function verifyOrderToken(kind: OrderTokenKind, tenantId: string, number: number, token: unknown): boolean {
  if (typeof token !== "string" || token.length !== 24 || !Number.isInteger(number) || number <= 0) return false;
  const expected = Buffer.from(orderToken(kind, tenantId, number));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** First query-string value, or "" (Next passes `string | string[] | undefined`). */
export function firstParam(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}
