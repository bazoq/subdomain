"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, purgeExpiredSessions } from "@/server/auth/session";
import { getCurrentTenant } from "@/server/tenant";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { fail, type ActionResult } from "@/lib/action-result";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(64),
  password: z.string().min(1, "Password is required").max(200),
  next: z.string().optional(),
});

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

function safeNext(next: string | undefined, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/** Tenant admin login (runs on the tenant host). */
export async function tenantLogin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Please enter your username and password.");
  const tc = await getCurrentTenant();
  if (!tc) return fail("Site not found.");

  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `login:${ip}`, limit: 10, windowSec: 600, tenantId: tc.tenant.id });
  if (!rl.ok) return fail("Too many attempts. Please try again in a few minutes.");

  const user = await db.tenantUser.findUnique({
    where: { tenantId_username: { tenantId: tc.tenant.id, username: parsed.data.username.toLowerCase() } },
  });
  const generic = "Invalid username or password.";
  if (!user || !user.isActive) return fail(generic);
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return fail(`Account locked. Try again after ${Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)} minutes.`);
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    const fails = user.failedLogins + 1;
    await db.tenantUser.update({
      where: { id: user.id },
      data: {
        failedLogins: fails,
        lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60000) : null,
      },
    });
    return fail(generic);
  }
  await db.tenantUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession({ kind: "TENANT", tenantUserId: user.id, tenantId: tc.tenant.id });
  purgeExpiredSessions().catch(() => undefined);
  await audit({ tenantId: tc.tenant.id, actorKind: "TENANT", actorId: user.id, actorName: user.name, action: "auth.login" });
  redirect(safeNext(parsed.data.next, "/admin"));
}

export async function tenantLogout() {
  await destroySession("TENANT");
  redirect("/admin/login");
}

/** Super admin login (root host). */
export async function superLogin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Please enter your username and password.");
  const ip = await clientIp();
  const rl = await rateLimit({ bucket: `superlogin:${ip}`, limit: 8, windowSec: 600 });
  if (!rl.ok) return fail("Too many attempts. Please try again in a few minutes.");

  const ident = parsed.data.username.toLowerCase();
  const user = await db.superUser.findFirst({ where: { OR: [{ username: ident }, { email: ident }] } });
  const generic = "Invalid username or password.";
  if (!user || !user.isActive) return fail(generic);
  if (user.lockedUntil && user.lockedUntil > new Date()) return fail("Account locked. Try again later.");
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    const fails = user.failedLogins + 1;
    await db.superUser.update({
      where: { id: user.id },
      data: { failedLogins: fails, lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60000) : null },
    });
    return fail(generic);
  }
  await db.superUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession({ kind: "SUPER", superUserId: user.id });
  purgeExpiredSessions().catch(() => undefined);
  await audit({ actorKind: "SUPER", actorId: user.id, actorName: user.name, action: "auth.login" });
  redirect(safeNext(parsed.data.next, "/super"));
}

export async function superLogout() {
  await destroySession("SUPER");
  redirect("/super/login");
}
