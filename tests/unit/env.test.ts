import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `src/config/env.ts` validates `process.env` at import time. The production rules (real ROOT_DOMAIN,
 * strong non-placeholder SESSION_SECRET) must apply only when the app is RUNNING as a
 * real production deployment: NODE_ENV=production AND not the `next build` phase AND (VERCEL_ENV unset or
 * "production"). Each case re-imports the module with a fresh env (`vi.stubEnv` + `vi.resetModules`).
 */

const BASE = {
  NODE_ENV: "development",
  NEXT_PHASE: undefined,
  VERCEL: undefined,
  VERCEL_ENV: undefined,
  ROOT_DOMAIN: "localhost",
  NEXT_PUBLIC_ROOT_DOMAIN: "localhost",
  DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/db",
  DIRECT_URL: undefined,
  // 32+ chars but obviously a placeholder → rejected only by the production rules.
  SESSION_SECRET: "change-me-to-a-random-string-of-at-least-32-chars",
  R2_ACCOUNT_ID: undefined,
  R2_ACCESS_KEY_ID: undefined,
  R2_SECRET_ACCESS_KEY: undefined,
  R2_BUCKET: undefined,
  RESEND_API_KEY: undefined,
  NOTIFY_FROM_EMAIL: undefined,
  CRON_SECRET: undefined,
} as const;

const STRONG_SECRET = "kR9vT2mZ8qL4wN6hP1xC3bJ7dF5gY0sA2uE9iO4rQ6tW8yHv";

type Env = Partial<Record<keyof typeof BASE, string | undefined>>;

async function load(overrides: Env = {}) {
  const merged: Record<string, string | undefined> = { ...BASE, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined) vi.stubEnv(k, undefined as unknown as string);
    else vi.stubEnv(k, v);
  }
  vi.resetModules();
  return import("@/config/env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("env.ts — production rules are scoped to a real production runtime", () => {
  it("development accepts a placeholder secret and localhost", async () => {
    const mod = await load();
    expect(mod.env.ROOT_DOMAIN).toBe("localhost");
    expect(mod.isProd).toBe(false);
  });

  it("test env (what vitest sets) also skips the production rules", async () => {
    await expect(load({ NODE_ENV: "test" })).resolves.toBeTruthy();
  });

  it("NODE_ENV=production at runtime (no Vercel) enforces the rules and lists every problem", async () => {
    await expect(load({ NODE_ENV: "production" })).rejects.toThrow(/production rules apply/);
    await expect(load({ NODE_ENV: "production" })).rejects.toThrow(/ROOT_DOMAIN: must be the real platform domain/);
    await expect(load({ NODE_ENV: "production" })).rejects.toThrow(/SESSION_SECRET: looks like a placeholder/);
  });

  it("NODE_ENV=production on a Vercel production deployment enforces the rules", async () => {
    await expect(load({ NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "production" })).rejects.toThrow(/production rules apply/);
  });

  it("a valid production configuration boots", async () => {
    const mod = await load({ NODE_ENV: "production", ROOT_DOMAIN: "siteforge.pk", NEXT_PUBLIC_ROOT_DOMAIN: "siteforge.pk", SESSION_SECRET: STRONG_SECRET });
    expect(mod.isProd).toBe(true);
    expect(mod.env.ROOT_DOMAIN).toBe("siteforge.pk");
  });

  it("`next build` (NEXT_PHASE=phase-production-build) runs with the dummy build-time env — rules OFF", async () => {
    const mod = await load({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" });
    expect(mod.isProd).toBe(true);
    expect(mod.env.SESSION_SECRET).toBe(BASE.SESSION_SECRET);
  });

  it("Vercel preview / development deployments run with NODE_ENV=production but skip the rules", async () => {
    await expect(load({ NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "preview" })).resolves.toBeTruthy();
    await expect(load({ NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "development" })).resolves.toBeTruthy();
  });

  it("shape rules apply everywhere (not only in production)", async () => {
    await expect(load({ SESSION_SECRET: "short" })).rejects.toThrow(/SESSION_SECRET: must be at least 32 characters/);
    await expect(load({ DATABASE_URL: "mysql://x" })).rejects.toThrow(/DATABASE_URL: must be a postgres:\/\/ URL/);
    await expect(load({ NEXT_PUBLIC_ROOT_DOMAIN: "other.test" })).rejects.toThrow(/NEXT_PUBLIC_ROOT_DOMAIN: must equal ROOT_DOMAIN \(localhost\)/);
    await expect(load({ ROOT_DOMAIN: "https://x.pk" })).rejects.toThrow(/ROOT_DOMAIN: must be a bare hostname/);
    await expect(load({ RESEND_API_KEY: "re_x" })).rejects.toThrow(/NOTIFY_FROM_EMAIL: is required when RESEND_API_KEY is set/);
    // The error message never echoes the secret values themselves.
    await expect(load({ SESSION_SECRET: "short", DATABASE_URL: "mysql://user:pw@host/db" })).rejects.not.toThrow(/pw@host/);
  });

  it("weak-secret rules: variety and placeholder words, only in production", async () => {
    const prod = { NODE_ENV: "production", ROOT_DOMAIN: "siteforge.pk", NEXT_PUBLIC_ROOT_DOMAIN: "siteforge.pk" } as const;
    await expect(load({ ...prod, SESSION_SECRET: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })).rejects.toThrow(/too little variety/);
    await expect(load({ ...prod, SESSION_SECRET: `${STRONG_SECRET}-password` })).rejects.toThrow(/looks like a placeholder/);
    await expect(load({ SESSION_SECRET: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })).resolves.toBeTruthy();
  });

  it("R2 is all-or-nothing and needs no public URL", async () => {
    const r2 = { R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef", R2_ACCESS_KEY_ID: "AKIAXXXXXXXX", R2_SECRET_ACCESS_KEY: "s".repeat(32), R2_BUCKET: "siteforge-media" } as const;
    await expect(load({ R2_ACCOUNT_ID: r2.R2_ACCOUNT_ID })).rejects.toThrow(/R2 is half-configured/);
    await expect(load({ ...r2, R2_BUCKET: undefined })).rejects.toThrow(/R2 is half-configured/);
    const dev = await load(r2);
    expect(dev.r2Configured).toBe(true);
    const prod = await load({ ...r2, NODE_ENV: "production", ROOT_DOMAIN: "siteforge.pk", NEXT_PUBLIC_ROOT_DOMAIN: "siteforge.pk", SESSION_SECRET: STRONG_SECRET });
    expect(prod.r2Configured).toBe(true);
  });

  it("exports isVercel / r2Configured from the parsed values", async () => {
    const off = await load();
    expect(off.isVercel).toBe(false);
    expect(off.r2Configured).toBe(false);
    const on = await load({ VERCEL: "1", VERCEL_ENV: "preview" });
    expect(on.isVercel).toBe(true);
  });
});
