import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * In-memory stand-in for the `RateLimit` Prisma delegate, faithful to the calls `rateLimit()` makes:
 * `findFirst` returns a snapshot (never the stored object), `update` honours the conditional
 * `where: { id, windowEnd: { lt } }` reset and throws Prisma's P2025 when no row matches.
 */
type Row = { id: string; tenantId: string | null; bucket: string; hits: number; windowEnd: Date };
const rows: Row[] = [];
let seq = 0;

class NotFound extends Error {
  code = "P2025";
}

const db = {
  rateLimit: {
    findFirst: vi.fn(async ({ where }: { where: { tenantId: string | null; bucket: string } }) => {
      const row = rows.find((r) => r.tenantId === where.tenantId && r.bucket === where.bucket);
      return row ? { ...row } : null;
    }),
    create: vi.fn(async ({ data }: { data: Omit<Row, "id"> }) => {
      const row = { id: `rl_${++seq}`, ...data };
      rows.push(row);
      return { ...row };
    }),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string; windowEnd?: { lt: Date } };
        data: { hits?: number | { increment: number }; windowEnd?: Date };
      }) => {
        const row = rows.find((r) => r.id === where.id && (!where.windowEnd || r.windowEnd < where.windowEnd.lt));
        if (!row) throw new NotFound("Record to update not found.");
        if (typeof data.hits === "number") row.hits = data.hits;
        else if (data.hits) row.hits += data.hits.increment;
        if (data.windowEnd) row.windowEnd = data.windowEnd;
        return { ...row };
      },
    ),
    deleteMany: vi.fn(async ({ where }: { where: { windowEnd: { lt: Date } } }) => {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i--) if (rows[i].windowEnd < where.windowEnd.lt) rows.splice(i, 1);
      return { count: before - rows.length };
    }),
  },
};

const logError = vi.fn();
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/lib/log", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/log")>();
  return { ...mod, log: { ...mod.log, error: (...args: unknown[]) => logError(...args) } };
});
const forwardedFor = { value: "203.0.113.9, 10.0.0.1" };
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": forwardedFor.value })),
}));

const { clientIp, purgeExpiredRateLimits, rateLimit } = await import("@/server/rate-limit");

/** Narrow a blocked result so its `retryAfterSec` can be asserted. */
function blocked(r: Awaited<ReturnType<typeof rateLimit>>) {
  expect(r.ok).toBe(false);
  if (r.ok) throw new Error("expected a blocked result");
  return r;
}

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
    const r = blocked(await rateLimit(opts));
    expect(r.retryAfterSec).toBe(540);
    expect(r.remaining).toBe(0);
    expect(db.rateLimit.create).toHaveBeenCalledTimes(1);
    // Blocked hits are still counted (atomic increment) but never reset the window.
    expect(rows[0].hits).toBe(4);
  });

  it("reports at least 1s retryAfterSec right before the window ends", async () => {
    const opts = { bucket: "edge", limit: 1, windowSec: 60 };
    await rateLimit(opts);
    vi.advanceTimersByTime(59_900);
    expect(blocked(await rateLimit(opts)).retryAfterSec).toBe(1);
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
    expect(rows[0].windowEnd).toEqual(new Date("2026-09-27T10:02:01Z"));
  });

  it("only one racer resets an expired window; the loser just counts (P2025)", async () => {
    const opts = { bucket: "reset-race", limit: 5, windowSec: 60 };
    await rateLimit(opts);
    vi.advanceTimersByTime(61_000);
    // Simulate: between findFirst and the conditional update another request already reset the window.
    db.rateLimit.findFirst.mockImplementationOnce(async () => ({ ...rows[0] }));
    db.rateLimit.update.mockImplementationOnce(async () => {
      rows[0].hits = 1;
      rows[0].windowEnd = new Date(Date.now() + 60_000);
      throw new NotFound("Record to update not found.");
    });
    expect(await rateLimit(opts)).toEqual({ ok: true, remaining: 3 });
    expect(rows[0].hits).toBe(2);
  });

  it("keeps buckets separate per tenant and per bucket name", async () => {
    await rateLimit({ bucket: "b", limit: 1, windowSec: 60, tenantId: "t1" });
    expect((await rateLimit({ bucket: "b", limit: 1, windowSec: 60, tenantId: "t2" })).ok).toBe(true);
    expect((await rateLimit({ bucket: "c", limit: 1, windowSec: 60, tenantId: "t1" })).ok).toBe(true);
    expect((await rateLimit({ bucket: "b", limit: 1, windowSec: 60, tenantId: "t1" })).ok).toBe(false);
    expect(rows).toHaveLength(3);
  });

  it("treats a missing tenantId as the platform-wide null bucket and bounds the bucket key", async () => {
    await rateLimit({ bucket: `x:${"a".repeat(500)}`, limit: 5, windowSec: 60 });
    expect(rows[0].tenantId).toBeNull();
    expect(rows[0].bucket).toHaveLength(120);
  });

  it("clamps a nonsensical limit to at least 1", async () => {
    expect(await rateLimit({ bucket: "zero", limit: 0, windowSec: 60 })).toEqual({ ok: true, remaining: 0 });
    expect((await rateLimit({ bucket: "zero", limit: 0, windowSec: 60 })).ok).toBe(false);
  });

  it("survives a create race (unique violation) by counting against the winner's row", async () => {
    db.rateLimit.create.mockImplementationOnce(async () => {
      rows.push({ id: "rl_other", tenantId: null, bucket: "race", hits: 1, windowEnd: new Date(Date.now() + 60_000) });
      throw new Error("Unique constraint failed");
    });
    await expect(rateLimit({ bucket: "race", limit: 5, windowSec: 60 })).resolves.toEqual({ ok: true, remaining: 3 });
    expect(rows[0].hits).toBe(2);
  });

  it("fails OPEN with degraded=true (and logs) when the database is unreachable", async () => {
    db.rateLimit.findFirst.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const r = await rateLimit({ bucket: "down", limit: 5, windowSec: 60, tenantId: "t9" });
    expect(r).toEqual({ ok: true, remaining: 4, degraded: true });
    expect(logError).toHaveBeenCalledWith("ratelimit.degraded", expect.objectContaining({ bucket: "down", tenantId: "t9", errorMessage: "ECONNREFUSED" }));
  });

  it("runs opportunistic cleanup of expired windows on ~2% of new windows", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    await rateLimit({ bucket: "cleanup", limit: 5, windowSec: 60 });
    expect(db.rateLimit.deleteMany).toHaveBeenCalledTimes(1);
  });
});

describe("purgeExpiredRateLimits", () => {
  it("deletes only expired windows and returns the count", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T10:00:00Z"));
    rows.length = 0;
    rows.push(
      { id: "a", tenantId: null, bucket: "old", hits: 1, windowEnd: new Date("2026-09-27T09:00:00Z") },
      { id: "b", tenantId: null, bucket: "live", hits: 1, windowEnd: new Date("2026-09-27T11:00:00Z") },
    );
    expect(await purgeExpiredRateLimits()).toBe(1);
    expect(rows.map((r) => r.id)).toEqual(["b"]);
  });
});

describe("clientIp", () => {
  it("returns the first hop of x-forwarded-for, lowercased", async () => {
    forwardedFor.value = "203.0.113.9, 10.0.0.1";
    expect(await clientIp()).toBe("203.0.113.9");
    forwardedFor.value = "2001:DB8::1";
    expect(await clientIp()).toBe("2001:db8::1");
  });

  it("collapses anything that is not an IP to 'unknown'", async () => {
    for (const v of ["", "not an ip", "<script>", "1.2.3.4; DROP", "x".repeat(60)]) {
      forwardedFor.value = v;
      expect(await clientIp(), JSON.stringify(v)).toBe("unknown");
    }
  });
});
