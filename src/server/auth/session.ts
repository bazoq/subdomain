import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/server/db";
import { isProd } from "@/config/env";
import { hmacHex } from "@/server/auth/hmac";
import type { SessionKind, SuperUser, TenantUser } from "@/generated/prisma/client";

/**
 * Opaque, database-backed sessions.
 *
 *  - The cookie carries a 256-bit random token. The database stores only
 *    HMAC-SHA256(SESSION_SECRET, token), so a leaked database dump cannot be replayed as a
 *    cookie and a leaked cookie cannot be looked up without the secret.
 *  - Cookies are `__Host-` prefixed in production (browser-enforced: Secure, Path=/, no Domain),
 *    HttpOnly and SameSite=Lax. The tenant cookie is therefore bound to exactly one tenant host.
 *  - Logging in rotates the session (any previous session behind the cookie is deleted).
 *  - Logout deletes the row (server-side invalidation), not just the cookie.
 *  - `revokeSessions` lets password changes / deactivation kill every other session of a user.
 */

export const SUPER_COOKIE = isProd ? "__Host-sf_super" : "sf_super";
export const TENANT_COOKIE = isProd ? "__Host-sf_admin" : "sf_admin";
const SESSION_DAYS = 14;

/** Keyed hash of a session token (hex). Same input + same SESSION_SECRET => same output. */
export function hashToken(token: string): Promise<string> {
  return hmacHex("session", token);
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const TOKEN_RE = /^[A-Za-z0-9_-]{40,48}$/;

async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim().slice(0, 64) || null;
  const userAgent = h.get("user-agent")?.slice(0, 255) ?? null;
  return { ip, userAgent };
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

function cookieName(kind: SessionKind) {
  return kind === "SUPER" ? SUPER_COOKIE : TENANT_COOKIE;
}

async function currentToken(kind: SessionKind): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(cookieName(kind))?.value;
  return token && TOKEN_RE.test(token) ? token : null;
}

export async function createSession(input: {
  kind: SessionKind;
  superUserId?: string;
  tenantUserId?: string;
  tenantId?: string;
}) {
  // Rotate: whatever session the browser currently holds for this kind is invalidated first.
  const previous = await currentToken(input.kind);
  if (previous) await db.session.deleteMany({ where: { tokenHash: await hashToken(previous) } }).catch(() => undefined);

  const token = randomToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const meta = await requestMeta();
  await db.session.create({
    data: {
      kind: input.kind,
      tokenHash,
      superUserId: input.superUserId,
      tenantUserId: input.tenantUserId,
      tenantId: input.tenantId,
      expiresAt,
      ...meta,
    },
  });
  const jar = await cookies();
  jar.set(cookieName(input.kind), token, cookieOptions(expiresAt));
}

/** Delete the current session row and clear the cookie. Returns who was signed out (for auditing). */
export async function destroySession(kind: SessionKind): Promise<{ superUserId: string | null; tenantUserId: string | null; tenantId: string | null } | null> {
  const token = await currentToken(kind);
  let who: { superUserId: string | null; tenantUserId: string | null; tenantId: string | null } | null = null;
  if (token) {
    const tokenHash = await hashToken(token);
    const s = await db.session.findUnique({ where: { tokenHash }, select: { superUserId: true, tenantUserId: true, tenantId: true } });
    if (s) {
      who = s;
      await db.session.deleteMany({ where: { tokenHash } });
    }
  }
  const jar = await cookies();
  jar.delete({ name: cookieName(kind), path: "/" });
  return who;
}

/**
 * Server-side invalidation of every session of a user (or of a whole tenant).
 * Call after password change, deactivation, role downgrade or tenant suspension.
 */
export async function revokeSessions(target: { tenantUserId: string } | { superUserId: string } | { tenantId: string }): Promise<number> {
  const res = await db.session.deleteMany({ where: target });
  return res.count;
}

/** Super-admin session for the current request (root host only). */
export const getSuperSession = cache(async (): Promise<SuperUser | null> => {
  const token = await currentToken("SUPER");
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const s = await db.session.findUnique({ where: { tokenHash }, include: { superUser: true } });
  if (!s || s.kind !== "SUPER" || !s.superUser || s.expiresAt < new Date()) return null;
  if (!s.superUser.isActive) return null;
  return s.superUser;
});

/**
 * Tenant-admin session for the current request. The session MUST belong to the
 * tenant resolved from the host, otherwise it is ignored (defence in depth —
 * cookies are already host-scoped by the browser).
 */
export const getTenantSession = cache(async (tenantId: string): Promise<TenantUser | null> => {
  const token = await currentToken("TENANT");
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const s = await db.session.findUnique({ where: { tokenHash }, include: { tenantUser: true } });
  if (!s || s.kind !== "TENANT" || !s.tenantUser || s.expiresAt < new Date()) return null;
  if (s.tenantId !== tenantId || s.tenantUser.tenantId !== tenantId) return null;
  if (!s.tenantUser.isActive) return null;
  return s.tenantUser;
});

/** Housekeeping: remove expired sessions (called opportunistically on login and from the maintenance route). */
export async function purgeExpiredSessions(): Promise<number> {
  const res = await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return res.count;
}
