"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { DUMMY_HASH, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, purgeExpiredSessions } from "@/server/auth/session";
import { safeRedirectPath } from "@/server/auth/redirect";
import { getCurrentTenant } from "@/server/tenant";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { fail, type ActionResult } from "@/lib/action-result";

/**
 * Login / logout server actions.
 *
 * Anti-enumeration: every failure path (unknown user, inactive, locked, wrong password) returns
 * the same message and runs a bcrypt compare (against DUMMY_HASH when there is no account), so
 * response time and wording do not reveal whether a username exists.
 * Brute force: per-IP and per-account fixed-window limits, plus a 15-minute lock after 5 failures.
 */

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(64),
  password: z.string().min(1, "Password is required").max(200),
  next: z.string().max(512).optional(),
});

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const GENERIC = "Invalid username or password.";
const TOO_MANY = "Too many attempts. Please try again in a few minutes.";

/** Stable bucket key for a username (no raw user input in the bucket, bounded length). */
async function accountBucket(prefix: string, ident: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ident));
  const hex = Array.from(new Uint8Array(digest).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}:u:${hex}`;
}

function lockUntil(fails: number) {
  return fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
}

/** Tenant admin login (runs on the tenant host). */
export async function tenantLogin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Please enter your username and password.");
  const tc = await getCurrentTenant();
  if (!tc) return fail("Site not found.");
  if (tc.tenant.status === "SUSPENDED") return fail("This website is suspended. Please contact support.");

  const ident = parsed.data.username.toLowerCase();
  const ip = await clientIp();
  const [byIp, byAccount] = await Promise.all([
    rateLimit({ bucket: `login:${ip}`, limit: 10, windowSec: 600, tenantId: tc.tenant.id }),
    rateLimit({ bucket: await accountBucket("login", ident), limit: 10, windowSec: 900, tenantId: tc.tenant.id }),
  ]);
  if (!byIp.ok || !byAccount.ok) return fail(TOO_MANY);

  const user = await db.tenantUser.findUnique({ where: { tenantId_username: { tenantId: tc.tenant.id, username: ident } } });
  const locked = Boolean(user?.lockedUntil && user.lockedUntil > new Date());
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.isActive || locked || !ok) {
    if (user && user.isActive && !locked) {
      const fails = user.failedLogins + 1;
      await db.tenantUser.update({ where: { id: user.id }, data: { failedLogins: fails, lockedUntil: lockUntil(fails) } });
      if (fails >= MAX_FAILS) {
        await audit({ tenantId: tc.tenant.id, actorKind: "TENANT", actorId: user.id, actorName: user.name, action: "auth.locked", meta: { fails } });
      }
    }
    return fail(GENERIC);
  }

  await db.tenantUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession({ kind: "TENANT", tenantUserId: user.id, tenantId: tc.tenant.id });
  purgeExpiredSessions().catch(() => undefined);
  await audit({ tenantId: tc.tenant.id, actorKind: "TENANT", actorId: user.id, actorName: user.name, action: "auth.login" });
  redirect(safeRedirectPath(parsed.data.next, "/admin", { prefix: "/admin" }));
}

export async function tenantLogout() {
  const who = await destroySession("TENANT");
  if (who?.tenantUserId) {
    await audit({ tenantId: who.tenantId, actorKind: "TENANT", actorId: who.tenantUserId, actorName: "", action: "auth.logout" });
  }
  redirect("/admin/login");
}

/** Super admin login (root host). */
export async function superLogin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Please enter your username and password.");

  const ident = parsed.data.username.toLowerCase();
  const ip = await clientIp();
  const [byIp, byAccount] = await Promise.all([
    rateLimit({ bucket: `superlogin:${ip}`, limit: 8, windowSec: 600 }),
    rateLimit({ bucket: await accountBucket("superlogin", ident), limit: 8, windowSec: 900 }),
  ]);
  if (!byIp.ok || !byAccount.ok) return fail(TOO_MANY);

  const user = await db.superUser.findFirst({ where: { OR: [{ username: ident }, { email: ident }] } });
  const locked = Boolean(user?.lockedUntil && user.lockedUntil > new Date());
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.isActive || locked || !ok) {
    if (user && user.isActive && !locked) {
      const fails = user.failedLogins + 1;
      await db.superUser.update({ where: { id: user.id }, data: { failedLogins: fails, lockedUntil: lockUntil(fails) } });
      if (fails >= MAX_FAILS) await audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, action: "auth.locked", meta: { fails } });
    }
    return fail(GENERIC);
  }

  await db.superUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession({ kind: "SUPER", superUserId: user.id });
  purgeExpiredSessions().catch(() => undefined);
  await audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, action: "auth.login" });
  redirect(safeRedirectPath(parsed.data.next, "/super", { prefix: "/super" }));
}

export async function superLogout() {
  const who = await destroySession("SUPER");
  if (who?.superUserId) await audit({ actorKind: "SUPER", actorId: who.superUserId, actorName: "", action: "auth.logout" });
  redirect("/super/login");
}
