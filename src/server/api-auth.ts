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

/** Reject cross-site requests to mutating API routes. */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return null; // non-browser or same-origin GET
  try {
    if (new URL(origin).host !== host) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
