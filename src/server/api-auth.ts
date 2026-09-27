import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getSuperSession, getTenantSession } from "@/server/auth/session";
import { getCurrentTenant } from "@/server/tenant";
import type { Actor } from "@/server/storage/media";

/**
 * Resolve who is calling an API route.
 *  - root host + super cookie  -> SUPER
 *  - tenant host + admin cookie -> TENANT
 *  - tenant host, no cookie     -> PUBLIC (limited: private uploads only)
 * Tenant status (SUSPENDED) is enforced by the media service, which knows what the call does.
 */
export async function resolveActor(): Promise<Actor | null> {
  const tc = await getCurrentTenant();
  if (tc) {
    const user = await getTenantSession(tc.tenant.id);
    if (user) return { kind: "TENANT", id: user.id, tenantId: tc.tenant.id };
    return { kind: "PUBLIC", tenantId: tc.tenant.id };
  }
  const su = await getSuperSession();
  if (su) return { kind: "SUPER", id: su.id };
  return null;
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function hostnameOf(value: string | null): string | null {
  if (!value) return null;
  const h = value.trim().toLowerCase();
  if (!h || /[\s,\\/@?#%]/.test(h)) return null;
  // strip :port (IPv6 literals keep their brackets)
  return h.startsWith("[") ? h.replace(/\]:\d+$/, "]") : h.replace(/:\d+$/, "");
}

/**
 * CSRF guard for state-changing API routes (POST/PUT/PATCH/DELETE). Fails closed.
 *
 * Expected host = `x-request-host`, which proxy.ts sets after stripping any client-supplied
 * value and validating it (on Vercel from x-forwarded-host, elsewhere from Host); the raw Host
 * header is only a fallback for the case the proxy did not run.
 *
 * Decision order:
 *  1. `Sec-Fetch-Site` (every modern browser): anything but `same-origin`/`none` is rejected.
 *  2. `Origin` (or `Referer` when Origin is absent) must match the expected host.
 *  3. Neither header present -> rejected. Browsers always send one of them for cross-site
 *     POSTs, so a missing header means a non-browser client without a session cookie anyway,
 *     or a stripped header we must not trust.
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const expected = hostnameOf(req.headers.get("x-request-host")) ?? hostnameOf(req.headers.get("host"));
  if (!expected) return forbidden();

  const site = req.headers.get("sec-fetch-site")?.toLowerCase();
  if (site && site !== "same-origin" && site !== "none") return forbidden();

  const origin = req.headers.get("origin");
  const source = origin && origin !== "null" ? origin : req.headers.get("referer");
  if (!source) return site === "same-origin" ? null : forbidden();

  try {
    const u = new URL(source);
    if (u.protocol !== "https:" && u.protocol !== "http:") return forbidden();
    if (hostnameOf(u.host) !== expected) return forbidden();
  } catch {
    return forbidden();
  }
  return null;
}
