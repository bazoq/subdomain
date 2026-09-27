import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
vi.mock("@/server/db", () => ({ db: { $queryRaw: queryRaw } }));

// `env` is parsed once at import; CRON_SECRET must be present before the route (→ env) loads.
const CRON_SECRET = "health-test-cron-secret-0123456789";
process.env.CRON_SECRET = CRON_SECRET;
const { GET } = await import("@/app/api/health/route");

function req(headers: Record<string, string> = {}) {
  return new NextRequest("https://example.test/api/health", { headers });
}
const authed = () => req({ authorization: `Bearer ${CRON_SECRET}` });

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

  it("public: returns 200 with only {status,time} when the database answers", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["status", "time"]);
    expect(body.status).toBe("ok");
    expect(new Date(body.time).toISOString()).toBe(body.time);
  });

  it("public: returns 503 degraded without any detail when the database errors", async () => {
    queryRaw.mockRejectedValueOnce(new Error("ECONNREFUSED 127.0.0.1:1"));
    const res = await GET(req());
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ status: "degraded", time: expect.any(String) });
    expect(text).not.toContain("ECONNREFUSED");
  });

  it("authorised (Bearer CRON_SECRET): includes build info and the database check", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const res = await GET(authed());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.checks.database.status).toBe("ok");
    expect(body.build).toMatchObject({ env: "production", commit: "abcdef1", region: "bom1" });
    expect(body.build.node).toMatch(/^v\d+/);
    expect(typeof body.uptimeSec).toBe("number");
  });

  it("authorised: reports the database error message", async () => {
    queryRaw.mockRejectedValueOnce(new Error("ECONNREFUSED 127.0.0.1:1"));
    const res = await GET(authed());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toMatchObject({ status: "error", error: "ECONNREFUSED 127.0.0.1:1" });
  });

  it("authorised: returns 503 timeout when the database hangs", async () => {
    vi.useFakeTimers();
    queryRaw.mockReturnValueOnce(new Promise(() => undefined)); // never settles
    const pending = GET(authed());
    await vi.advanceTimersByTimeAsync(3_000);
    const res = await pending;
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.checks.database.status).toBe("timeout");
  });

  it("treats a wrong, truncated or non-Bearer token as public", async () => {
    for (const authorization of [
      `Bearer ${CRON_SECRET.slice(0, -1)}`,
      `Bearer ${CRON_SECRET}x`,
      `Bearer ${CRON_SECRET.toUpperCase()}`,
      `Basic ${Buffer.from(CRON_SECRET).toString("base64")}`,
      CRON_SECRET,
      "Bearer ",
    ]) {
      queryRaw.mockResolvedValueOnce([]);
      const body = await (await GET(req({ authorization }))).json();
      expect(Object.keys(body).sort(), authorization).toEqual(["status", "time"]);
    }
  });

  it("never leaks connection strings or secrets, even when authorised", async () => {
    queryRaw.mockResolvedValueOnce([]);
    const text = await (await GET(authed())).text();
    expect(text).not.toContain(process.env.DATABASE_URL);
    expect(text).not.toContain(process.env.SESSION_SECRET);
    expect(text).not.toContain(CRON_SECRET);
  });
});
