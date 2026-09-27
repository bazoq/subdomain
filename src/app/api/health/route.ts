import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/config/env";
import { errorFields, log } from "@/lib/log";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 2_500;

type Check = { status: "ok" | "error" | "timeout"; latencyMs: number; error?: string };

/**
 * GET /api/health — liveness + dependency check for uptime monitors and Vercel checks.
 * Always answers (never throws); returns 200 when the database responds, 503 otherwise.
 * Reachable on every host (root, tenant, preview) because `/api/*` is shared by the proxy.
 *
 * The public body is deliberately minimal (`{ status, time }`): commit SHA, branch, region, Node
 * version and the database latency/error are only included when the caller presents
 * `Authorization: Bearer <CRON_SECRET>` (the same secret Vercel Cron uses). Without CRON_SECRET
 * configured, the detailed view is unavailable to everyone.
 */
export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const db = await pingDatabase();
  const healthy = db.status === "ok";
  const time = new Date().toISOString();

  const body = isAuthorised(req)
    ? {
        status: healthy ? "ok" : "degraded",
        time,
        uptimeSec: Math.round(process.uptime()),
        build: {
          env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
          commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
          branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
          region: process.env.VERCEL_REGION ?? null,
          node: process.version,
        },
        checks: { database: db },
        totalMs: Date.now() - startedAt,
      }
    : { status: healthy ? "ok" : "degraded", time };

  if (!healthy) log.warn("health.degraded", { database: db });
  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" },
  });
}

/** True when the request carries `Authorization: Bearer <CRON_SECRET>` (constant-time compare). */
function isAuthorised(req: NextRequest): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  const presented = Buffer.from(auth.slice(7).trim());
  const expected = Buffer.from(secret);
  return presented.length === expected.length && timingSafeEqual(presented, expected);
}

async function pingDatabase(): Promise<Check> {
  const t0 = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Lazy import: the Prisma client (and its pg pool) is only created when the check runs.
    const { db } = await import("@/server/db");
    const timeout = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), DB_TIMEOUT_MS);
    });
    const result = await Promise.race([db.$queryRaw`SELECT 1`.then(() => "ok" as const), timeout]);
    if (result === "timeout") return { status: "timeout", latencyMs: Date.now() - t0, error: `no response within ${DB_TIMEOUT_MS}ms` };
    return { status: "ok", latencyMs: Date.now() - t0 };
  } catch (err) {
    const fields = errorFields(err);
    return { status: "error", latencyMs: Date.now() - t0, error: String(fields.errorMessage ?? "unknown error") };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
