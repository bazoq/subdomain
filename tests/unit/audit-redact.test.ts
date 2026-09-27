import { describe, expect, it, vi } from "vitest";

// audit.ts imports the Prisma client and the IP helper (next/headers) at module scope; neither is
// needed to test the pure redaction step.
vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/rate-limit", () => ({ clientIp: async () => "203.0.113.1" }));

const { redactMeta } = await import("@/server/audit");

describe("redactMeta", () => {
  it("returns an empty object for missing meta and passes plain values through", () => {
    expect(redactMeta(undefined)).toEqual({});
    expect(redactMeta({ id: "abc", count: 3, ok: true, none: null })).toEqual({ id: "abc", count: 3, ok: true, none: null });
  });

  it("masks values under credential-looking keys at any depth (case-insensitive)", () => {
    const out = redactMeta({
      username: "ali",
      password: "hunter22",
      Passphrase: "x",
      pwd: "x",
      newPassword: "x",
      SESSION_SECRET: "x",
      sessionToken: "x",
      passwordHash: "x",
      Authorization: "Bearer x",
      cookie: "sf_admin=x",
      apiKey: "x",
      "api-key": "x",
      access_key: "x",
      privateKey: "x",
      credential: "x",
      otp: "123456",
      pin: "1234",
      nested: { deep: { token: "x", name: "keep" } },
      list: [{ secret: "x", label: "keep" }],
    });
    expect(out.username).toBe("ali");
    for (const k of [
      "password",
      "Passphrase",
      "pwd",
      "newPassword",
      "SESSION_SECRET",
      "sessionToken",
      "passwordHash",
      "Authorization",
      "cookie",
      "apiKey",
      "api-key",
      "access_key",
      "privateKey",
      "credential",
      "otp",
      "pin",
    ]) {
      expect(out[k], k).toBe("[redacted]");
    }
    expect(out.nested).toEqual({ deep: { token: "[redacted]", name: "keep" } });
    expect(out.list).toEqual([{ secret: "[redacted]", label: "keep" }]);
  });

  it("does not over-match unrelated keys", () => {
    const out = redactMeta({ pinned: true, shipping: "x", hashtags: ["a"], tokens: 3, spinner: "y" });
    // `pin$` only matches keys ending in "pin"; `token`/`hash` are deliberately broad (see SENSITIVE_KEY).
    expect(out.pinned).toBe(true);
    expect(out.shipping).toBe("x");
    expect(out.spinner).toBe("y");
    expect(out.hashtags).toBe("[redacted]");
    expect(out.tokens).toBe("[redacted]");
  });

  it("serialises Dates and bigints, drops functions and symbols", () => {
    const d = new Date("2026-09-27T10:00:00.000Z");
    const out = redactMeta({ when: d, big: BigInt(42), fn: () => 1, sym: Symbol("s"), keep: 1 });
    expect(out.when).toBe("2026-09-27T10:00:00.000Z");
    expect(out.big).toBe("42");
    expect(out).not.toHaveProperty("fn");
    expect(out).not.toHaveProperty("sym");
    expect(out.keep).toBe(1);
  });

  it("bounds string length, array length and nesting depth", () => {
    const out = redactMeta({
      long: "x".repeat(5000),
      many: Array.from({ length: 250 }, (_, i) => i),
      deep: { a: { b: { c: { d: { e: { f: { g: "too deep" } } } } } } },
    });
    expect((out.long as string).length).toBeLessThanOrEqual(2001); // 2000 + ellipsis
    expect((out.long as string).endsWith("…")).toBe(true);
    expect((out.many as number[]).length).toBe(100);
    expect(JSON.stringify(out.deep)).toContain("[depth]");
    expect(JSON.stringify(out.deep)).not.toContain("too deep");
  });

  it("replaces an oversized payload with a summary of its keys", () => {
    const meta: Record<string, unknown> = {};
    for (let i = 0; i < 100; i++) meta[`k${i}`] = "y".repeat(1000);
    const out = redactMeta(meta);
    expect(out.truncated).toBe(true);
    expect(Array.isArray(out.keys)).toBe(true);
    expect((out.keys as string[]).length).toBeLessThanOrEqual(50);
    expect(JSON.stringify(out).length).toBeLessThan(16 * 1024);
  });

  it("never throws on cyclic input", () => {
    const meta: Record<string, unknown> = { name: "loop" };
    meta.self = meta;
    const out = redactMeta(meta);
    expect(out.name).toBe("loop");
    expect(JSON.stringify(out)).toContain("[depth]");
  });
});
