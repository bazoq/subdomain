import { beforeEach, describe, expect, it, vi } from "vitest";

/** In-memory stand-in for the `RateLimit` Prisma delegate. */
type Row = { id: string; tenantId: string | null; bucket: string; hits: number; windowEnd: Date };
const rows: Row[] = [];
let seq = 0;

const db = {
  rateLimit: {
    findFirst: vi.fn(async ({ where }: { where: { tenantId: string | null; bucket: string } }) =>
      rows.find((r) => r.tenantId === where.tenantId && r.bucket === where.bucket) ?? null,
    ),
    create: vi.fn(async ({ data }: { data: Omit<Row, "id"> }) => {
      const row = { id: `rl_${++seq}`, ...data };
      rows.push(row);
      return row;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: { hits?: number | { increment: number }; windowEnd?: Date } }) => {
      const row = rows.find((r) => r.id === where.id);
      if (!row) throw new Error("not found");
      if (typeof data.hits === "number") row.hits = data.hits;
      else if (data.hits) row.hits += data.hits.increment;
      if (data.windowEnd) row.windowEnd = data.windowEnd;
      return row;
    }),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  },
};

vi.mock("@/server/db", () => ({ db }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })),
}));

const { clientIp, rateLimit } = await import("@/server/rate-limit");

describe("rateLimit (Postgres fixed window)", () => {
  beforeEach(() => {
    rows.length = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T10:00:00Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.5); // never trigger opportunistic cleanup
  });

  it("allows up to `limit` hits then blocks with retryAfterSec", async () => {
    const opts = { bucket: "form:contact:203.0.113.9", limit: 3, windowSec: 600, tenantId: "t1" };
    expect(await rateLimit(opts)).toEqual({ ok: true, remaining: 2 });
    expect(await rateLimit(opts)).toEqual({ ok: true, remaining: 1 });
    expect(await rateLimit(opts)).toEqual({ ok: true, remaining: 0 });
    vi.advanceTimersByTime(60_000);
    const blocked = await rateLimit(opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(540);
    expect(db.rateLimit.create).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh window once the previous one expired", async () => {
    const opts = { bucket: "login:203.0.113.9", limit: 1, windowSec: 60 };
    expect((await rateLimit(opts)).ok).toBe(true);
    expect((await rateLimit(opts)).ok).toBe(false);
    vi.advanceTimersByTime(61_000);
    const r = await rateLimit(opts);
    expect(r).toEqual({ ok: true, remaining: 0 });
    expect(rows).toHaveLength(1);
    expect(rows[0].hits).toBe(1);
  });

  it("keeps buckets separate per tenant and per bucket name", async () => {
    await rateLimit({ bucket: "b", limit: 1, windowSec: 60, tenantId: "t1" });
    expect((await rateLimit({ bucket: "b", limit: 1, windowSec: 60, tenantId: "t2" })).ok).toBe(true);
    expect((await rateLimit({ bucket: "c", limit: 1, windowSec: 60, tenantId: "t1" })).ok).toBe(true);
    expect((await rateLimit({ bucket: "b", limit: 1, windowSec: 60, tenantId: "t1" })).ok).toBe(false);
    expect(rows).toHaveLength(3);
  });

  it("treats a missing tenantId as the platform-wide null bucket", async () => {
    await rateLimit({ bucket: "global", limit: 5, windowSec: 60 });
    expect(rows[0].tenantId).toBeNull();
  });

  it("survives a create race (unique violation) without throwing", async () => {
    db.rateLimit.create.mockRejectedValueOnce(new Error("unique constraint"));
    await expect(rateLimit({ bucket: "race", limit: 5, windowSec: 60 })).resolves.toEqual({ ok: true, remaining: 4 });
  });

  it("runs opportunistic cleanup of expired windows on ~2% of new windows", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    await rateLimit({ bucket: "cleanup", limit: 5, windowSec: 60 });
    expect(db.rateLimit.deleteMany).toHaveBeenCalledTimes(1);
  });
});

describe("clientIp", () => {
  it("returns the first hop of x-forwarded-for", async () => {
    expect(await clientIp()).toBe("203.0.113.9");
  });
});
