import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/config/env";
import { purgeExpiredSessions } from "@/server/auth/session";
import { purgeExpiredRateLimits } from "@/server/rate-limit";
import { purgeUnconfirmedMedia } from "@/server/storage/media";
import { timingSafeEqualHex } from "@/server/auth/hmac";
import { log, errorFields } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/maintenance — scheduled housekeeping (Vercel Cron sends
 * `Authorization: Bearer <CRON_SECRET>`; see docs/DEPLOY.md). Disabled (404) until CRON_SECRET
 * is configured. Purges expired sessions and rate-limit windows and deletes uploads that were
 * never confirmed (row + object). Each task is isolated: one failing task does not stop the rest.
 */
export async function GET(req: NextRequest) {
  const secret = env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!presented || !timingSafeEqualHex(toHex(presented), toHex(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const results: Record<string, number | string> = {};
  const tasks: Array<[string, () => Promise<number>]> = [
    ["sessions", purgeExpiredSessions],
    ["rateLimits", purgeExpiredRateLimits],
    ["unconfirmedMedia", () => purgeUnconfirmedMedia({ batch: 500 })],
  ];
  for (const [name, run] of tasks) {
    try {
      results[name] = await run();
    } catch (err) {
      results[name] = "error";
      log.error("cron.maintenance.task_failed", { task: name, ...errorFields(err) });
    }
  }
  log.info("cron.maintenance", { ...results, ms: Date.now() - started });
  return NextResponse.json({ ok: true, results, ms: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
}

function toHex(s: string) {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
