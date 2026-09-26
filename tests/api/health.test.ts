import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
vi.mock("@/server/db", () => ({ db: { $queryRaw: queryRaw } }));

const { GET } = await import("@/app/api/health/route");

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abcdef1234567890");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_REGION", "bom1");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("returns 200 with build info when the database answers", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.checks.database.status).toBe("ok");
    expect(body.build).toMatchObject({ env: "production", commit: "abcdef1", region: "bom1" });
    expect(body.build.node).toMatch(/^v\d+/);
    expect(typeof body.uptimeSec).toBe("number");
  });

  it("returns 503 degraded (never throws) when the database errors", async () => {
    queryRaw.mockRejectedValueOnce(new Error("ECONNREFUSED 127.0.0.1:1"));
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toMatchObject({ status: "error", error: "ECONNREFUSED 127.0.0.1:1" });
  });

  it("returns 503 timeout when the database hangs", async () => {
    vi.useFakeTimers();
    queryRaw.mockReturnValueOnce(new Promise(() => undefined)); // never settles
    const pending = GET();
    await vi.advanceTimersByTimeAsync(3_000);
    const res = await pending;
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.checks.database.status).toBe("timeout");
  });

  it("does not leak connection strings or secrets", async () => {
    queryRaw.mockResolvedValueOnce([]);
    const text = await (await GET()).text();
    expect(text).not.toContain(process.env.DATABASE_URL);
    expect(text).not.toContain(process.env.SESSION_SECRET);
  });
});
