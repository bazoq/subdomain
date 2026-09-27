import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/server/auth/redirect";

/**
 * Open-redirect guard used for `?next=` / `?back=` after login and language switches.
 * Every rejected input must fall back to the caller's default, never to the attacker's URL.
 */
const FALLBACK = "/admin";

describe("safeRedirectPath", () => {
  it("accepts same-origin, path-absolute targets and keeps the query string", () => {
    expect(safeRedirectPath("/admin/products", FALLBACK)).toBe("/admin/products");
    expect(safeRedirectPath("/admin/products?page=2&q=a%20b", FALLBACK)).toBe("/admin/products?page=2&q=a%20b");
    expect(safeRedirectPath("  /admin/orders  ", FALLBACK)).toBe("/admin/orders");
    expect(safeRedirectPath("/", FALLBACK)).toBe("/");
  });

  it("drops the fragment", () => {
    expect(safeRedirectPath("/admin/settings#danger", FALLBACK)).toBe("/admin/settings");
  });

  it("falls back for missing or empty values", () => {
    expect(safeRedirectPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("   ", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects absolute URLs, scheme-relative and backslash variants", () => {
    for (const bad of [
      "https://evil.example/",
      "http://evil.example",
      "javascript:alert(1)",
      "//evil.example/admin",
      "/\\evil.example",
      "\\\\evil.example",
      "/%5Cevil.example",
      "/%5cevil.example",
      "/%2Fevil.example",
      "/%2f%2fevil.example",
      "/admin\\..\\evil",
      "admin/products", // relative
      "?next=/admin", // no leading slash
    ]) {
      expect(safeRedirectPath(bad, FALLBACK), bad).toBe(FALLBACK);
    }
  });

  it("rejects control characters, whitespace inside the path and credentials", () => {
    expect(safeRedirectPath("/admin\r\nSet-Cookie: x=1", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/admin\u0000", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/admin\u007f", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/admin products", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/admin\tproducts", FALLBACK)).toBe(FALLBACK);
  });

  it("enforces the length limit (default 512, overridable)", () => {
    const long = `/${"a".repeat(600)}`;
    expect(safeRedirectPath(long, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath(long, FALLBACK, { maxLength: 1000 })).toBe(long);
    expect(safeRedirectPath("/abcdef", FALLBACK, { maxLength: 5 })).toBe(FALLBACK);
  });

  it("constrains to a prefix when asked (segment-aware)", () => {
    expect(safeRedirectPath("/admin", FALLBACK, { prefix: "/admin" })).toBe("/admin");
    expect(safeRedirectPath("/admin/orders", FALLBACK, { prefix: "/admin" })).toBe("/admin/orders");
    expect(safeRedirectPath("/administrator", FALLBACK, { prefix: "/admin" })).toBe(FALLBACK);
    expect(safeRedirectPath("/super/tenants", FALLBACK, { prefix: "/admin" })).toBe(FALLBACK);
    expect(safeRedirectPath("/admin/../super", FALLBACK, { prefix: "/admin" })).toBe(FALLBACK); // resolves to /super
    expect(safeRedirectPath("/super/x", "/super", { prefix: "/super/" })).toBe("/super/x");
  });

  it("normalises dot segments through URL resolution", () => {
    expect(safeRedirectPath("/admin/./products/../orders", FALLBACK)).toBe("/admin/orders");
  });
});
