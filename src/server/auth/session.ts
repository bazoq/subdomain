import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/server/db";
import type { SessionKind, SuperUser, TenantUser } from "@/generated/prisma/client";

export const SUPER_COOKIE = "sf_super";
export const TENANT_COOKIE = "sf_admin";
const SESSION_DAYS = 14;

function sha256(input: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  );
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim() || null;
  const userAgent = h.get("user-agent")?.slice(0, 255) ?? null;
  return { ip, userAgent };
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export async function createSession(input: {
  kind: SessionKind;
  superUserId?: string;
  tenantUserId?: string;
  tenantId?: string;
}) {
  const token = randomToken();
  const tokenHash = await sha256(token);
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
  jar.set(input.kind === "SUPER" ? SUPER_COOKIE : TENANT_COOKIE, token, cookieOptions(expiresAt));
}

export async function destroySession(kind: SessionKind) {
  const name = kind === "SUPER" ? SUPER_COOKIE : TENANT_COOKIE;
  const jar = await cookies();
  const token = jar.get(name)?.value;
  if (token) {
    const tokenHash = await sha256(token);
    await db.session.deleteMany({ where: { tokenHash } });
  }
  jar.delete(name);
}

/** Super-admin session for the current request (root host only). */
export const getSuperSession = cache(async (): Promise<SuperUser | null> => {
  const jar = await cookies();
  const token = jar.get(SUPER_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256(token);
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
  const jar = await cookies();
  const token = jar.get(TENANT_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const s = await db.session.findUnique({ where: { tokenHash }, include: { tenantUser: true } });
  if (!s || s.kind !== "TENANT" || !s.tenantUser || s.expiresAt < new Date()) return null;
  if (s.tenantId !== tenantId || s.tenantUser.tenantId !== tenantId) return null;
  if (!s.tenantUser.isActive) return null;
  return s.tenantUser;
});

/** Housekeeping: remove expired sessions (called opportunistically on login). */
export async function purgeExpiredSessions() {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
