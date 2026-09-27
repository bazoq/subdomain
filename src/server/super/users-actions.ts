"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireSuperAction, requireSuperRole } from "@/server/auth/guards";
import { hashPassword, passwordPolicy, PASSWORD_MAX, PASSWORD_MIN, verifyPassword } from "@/server/auth/password";
import { revokeSessions } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { log } from "@/lib/log";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const USERNAME = /^[a-z0-9][a-z0-9._-]{2,39}$/;
const PASSWORD_TOO_SHORT = `Password must be at least ${PASSWORD_MIN} characters`;

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(40),
  email: z.email("Enter a valid email").trim().max(120),
  password: z.string().min(PASSWORD_MIN, PASSWORD_TOO_SHORT).max(PASSWORD_MAX),
  role: z.enum(["SUPERADMIN", "EDITOR"]).default("EDITOR"),
});
export type CreateSuperUserInput = z.infer<typeof createSchema>;

/** Only a SUPERADMIN may manage other platform accounts. */
async function requireSuperAdmin() {
  const me = await requireSuperAction();
  requireSuperRole(me, ["SUPERADMIN"]);
  return me;
}

export async function createSuperUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireSuperAdmin();
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const username = parsed.data.username.toLowerCase();
    const email = parsed.data.email.toLowerCase();
    if (!USERNAME.test(username)) return fail("Invalid username.", { username: "Use lowercase letters, digits, dots, dashes or underscores." });
    const pw = passwordPolicy(parsed.data.password, { username });
    if (pw) return fail(pw, { password: pw });
    const clash = await db.superUser.findFirst({ where: { OR: [{ username }, { email }] }, select: { username: true, email: true } });
    if (clash) {
      return clash.username === username ? fail("Username already exists.", { username: "Already taken." }) : fail("Email already in use.", { email: "Already in use." });
    }
    const row = await db.superUser.create({
      data: { username, email, name: parsed.data.name, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) },
    });
    await audit({ actorKind: "SUPER", actorId: me.id, actorName: me.name, action: "superUser.create", entity: "SuperUser", entityId: row.id, meta: { username, role: row.role } });
    revalidatePath("/super/users");
    return success("Super user created.", { id: row.id });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function resetSuperUserPassword(userId: string, password: string): Promise<ActionResult> {
  try {
    const me = await requireSuperAdmin();
    const target = await db.superUser.findUnique({ where: { id: userId } });
    if (!target) return fail("User not found.");
    const pw = passwordPolicy(password ?? "", { username: target.username });
    if (pw) return fail(pw);
    await db.superUser.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null } });
    const revoked = await revokeSessions({ superUserId: userId });
    await audit({ actorKind: "SUPER", actorId: me.id, actorName: me.name, action: "superUser.resetPassword", entity: "SuperUser", entityId: userId, meta: { revoked } });
    log.info("superUser.resetPassword", { by: me.id, userId, revoked });
    return success(`Password reset for ${target.username}. Their sessions were signed out.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleSuperUser(userId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const me = await requireSuperAdmin();
    if (!isActive && userId === me.id) return fail("You cannot deactivate your own account.");
    const target = await db.superUser.findUnique({ where: { id: userId } });
    if (!target) return fail("User not found.");
    if (!isActive && target.role === "SUPERADMIN" && target.isActive) {
      const admins = await db.superUser.count({ where: { role: "SUPERADMIN", isActive: true } });
      if (admins <= 1) return fail("Cannot deactivate the last active SUPERADMIN.");
    }
    await db.superUser.update({ where: { id: userId }, data: { isActive } });
    const revoked = isActive ? 0 : await revokeSessions({ superUserId: userId });
    await audit({ actorKind: "SUPER", actorId: me.id, actorName: me.name, action: isActive ? "superUser.activate" : "superUser.deactivate", entity: "SuperUser", entityId: userId, meta: { revoked } });
    revalidatePath("/super/users");
    return success(isActive ? "User activated." : "User deactivated and signed out everywhere.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

const roleSchema = z.enum(["SUPERADMIN", "EDITOR"]);

/** Change another super user's role. A downgrade revokes their sessions so cached permissions cannot linger. */
export async function setSuperUserRole(userId: string, role: string): Promise<ActionResult> {
  try {
    const me = await requireSuperAdmin();
    const parsed = roleSchema.safeParse(role);
    if (!parsed.success) return fail("Invalid role.");
    if (userId === me.id) return fail("You cannot change your own role.");
    const target = await db.superUser.findUnique({ where: { id: userId } });
    if (!target) return fail("User not found.");
    if (target.role === parsed.data) return fail(`${target.username} is already ${parsed.data}.`);
    if (target.role === "SUPERADMIN" && target.isActive) {
      const admins = await db.superUser.count({ where: { role: "SUPERADMIN", isActive: true } });
      if (admins <= 1) return fail("Cannot downgrade the last active SUPERADMIN.");
    }
    await db.superUser.update({ where: { id: userId }, data: { role: parsed.data } });
    const revoked = await revokeSessions({ superUserId: userId });
    await audit({ actorKind: "SUPER", actorId: me.id, actorName: me.name, action: "superUser.role", entity: "SuperUser", entityId: userId, meta: { from: target.role, to: parsed.data, revoked } });
    revalidatePath("/super/users");
    return success(`${target.username} is now ${parsed.data}. They were signed out and must sign in again.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

const changePasswordSchema = z.object({
  current: z.string().min(1, "Enter your current password").max(PASSWORD_MAX),
  password: z.string().min(PASSWORD_MIN, PASSWORD_TOO_SHORT).max(PASSWORD_MAX),
  confirm: z.string().max(PASSWORD_MAX),
});

/** Form action for /super/users/password (useActionState). Any signed-in super user may change their own password. */
export async function changeOwnPassword(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  try {
    const me = await requireSuperAction();
    const parsed = changePasswordSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    if (d.password !== d.confirm) return fail("Passwords do not match.", { confirm: "Passwords do not match." });
    const pw = passwordPolicy(d.password, { username: me.username });
    if (pw) return fail(pw, { password: pw });
    if (!(await verifyPassword(d.current, me.passwordHash))) return fail("Current password is incorrect.", { current: "Incorrect password." });
    if (await verifyPassword(d.password, me.passwordHash)) return fail("Choose a password you have not used before.", { password: "Same as the current password." });
    await db.superUser.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(d.password) } });
    await audit({ actorKind: "SUPER", actorId: me.id, actorName: me.name, action: "superUser.changePassword", entity: "SuperUser", entityId: me.id });
    return success("Password changed.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
