import { describe, expect, it } from "vitest";
import { firstParam, orderToken, verifyOrderToken } from "@/modules/ecommerce/order-token";

/**
 * HMAC access token for public order pages. Order numbers are sequential per tenant, so the token
 * is the only thing standing between a visitor and other customers' order details.
 */
describe("orderToken", () => {
  it("is deterministic, 24 chars, base64url", () => {
    const t = orderToken("shop", "tenant_a", 1042);
    expect(t).toHaveLength(24);
    expect(t).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(orderToken("shop", "tenant_a", 1042)).toBe(t);
  });

  it("changes with kind, tenant and number (no cross-tenant or cross-kind reuse)", () => {
    const base = orderToken("shop", "tenant_a", 1042);
    expect(orderToken("food", "tenant_a", 1042)).not.toBe(base);
    expect(orderToken("shop", "tenant_b", 1042)).not.toBe(base);
    expect(orderToken("shop", "tenant_a", 1043)).not.toBe(base);
    // The separator matters: ("tenant_a:1", 42) must not collide with ("tenant_a", "1:42").
    expect(orderToken("shop", "tenant_a:1", 42)).not.toBe(orderToken("shop", "tenant_a", 142));
  });
});

describe("verifyOrderToken", () => {
  it("accepts the matching token only", () => {
    const t = orderToken("food", "tenant_a", 7);
    expect(verifyOrderToken("food", "tenant_a", 7, t)).toBe(true);
    expect(verifyOrderToken("shop", "tenant_a", 7, t)).toBe(false);
    expect(verifyOrderToken("food", "tenant_b", 7, t)).toBe(false);
    expect(verifyOrderToken("food", "tenant_a", 8, t)).toBe(false);
  });

  it("rejects malformed tokens without throwing", () => {
    const t = orderToken("shop", "tenant_a", 7);
    for (const bad of [undefined, null, "", 123, {}, [t], t.slice(0, 23), `${t}A`, t.toUpperCase() === t ? `${t.slice(1)}a` : t.toUpperCase()]) {
      expect(verifyOrderToken("shop", "tenant_a", 7, bad), String(bad)).toBe(false);
    }
  });

  it("rejects impossible order numbers", () => {
    const t = orderToken("shop", "tenant_a", 0);
    expect(verifyOrderToken("shop", "tenant_a", 0, t)).toBe(false);
    expect(verifyOrderToken("shop", "tenant_a", -5, orderToken("shop", "tenant_a", -5))).toBe(false);
    expect(verifyOrderToken("shop", "tenant_a", 1.5, orderToken("shop", "tenant_a", 1.5))).toBe(false);
    expect(verifyOrderToken("shop", "tenant_a", Number.NaN, "x".repeat(24))).toBe(false);
  });
});

describe("firstParam", () => {
  it("returns the first query value or an empty string", () => {
    expect(firstParam("abc")).toBe("abc");
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam([])).toBe("");
    expect(firstParam(undefined)).toBe("");
  });
});
