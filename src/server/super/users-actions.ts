"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { requireSuperAction } from "@/server/auth/guards";
import { hashPassword, passwordPolicy, verifyPassword } from "@/server/auth/password";
import { audit } from "@/server/audit";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const USERNAME = /^[a-z0-9][a-z0-9._-]{2,39}$/;

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(40),
  email: z.email("Enter a valid email").trim().max(120),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["SUPERADMIN", "EDITOR"]).default("EDITOR"),
});
export type CreateSuperUserInput = z.infer<typeof createSchema>;

function requireSuperAdmin(role: string) {
  if (role !== "SUPERADMIN") throw new Error("Only a SUPERADMIN can manage super users.");
}

export async function createSuperUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireSuperAction();
    requireSuperAdmin(me.role);
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const username = parsed.data.username.toLowerCase();
    const email = parsed.data.email.toLowerCase();
    if (!USERNAME.test(username)) return fail("Invalid username.", { username: "Use lowercase letters, digits, dots, dashes or underscores." });
    const pw = passwordPolicy(parsed.data.password);
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
    const me = await requireSuperAction();
    requireSuperAdmin(me.role);
    const pw = passwordPolicy(password ?? "");
    if (pw) return fail(pw);
    const target = await db.superUser.findUnique({ where: { id: userId } });
    if (!target) return fail("User not found.");
    await db.$transaction([
      db.superUser.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null } }),
      db.session.deleteMany({ where: { superUserId: userId } }),
    ]);
    await audit({ actorKind: "SUPER", actorId: me.id, actorName: me.name, action: "superUser.resetPassword", entity: "SuperUser", entityId: userId });
    return success(`Password reset for ${target.username}. Their sessions were signed out.`);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function toggleSuperUser(userId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const me = await requireSuperAction();
    requireSuperAdmin(me.role);
    if (!isActive && userId === me.id) return fail("You cannot deactivate your own account.");
    const target = await db.superUser.findUnique({ where: { id: userId } });
    if (!target) return fail("User not found.");
    if (!isActive && target.role === "SUPERADMIN" && target.isActive) {
      const admins = await db.superUser.count({ where: { role: "SUPERADMIN", isActive: true } });
      if (admins <= 1) return fail("Cannot deactivate the last active SUPERADMIN.");
    }
    await db.$transaction([
      db.superUser.update({ where: { id: userId }, data: { isActive } }),
      ...(isActive ? [] : [db.session.deleteMany({ where: { superUserId: userId } })]),
    ]);
    await audit({ actorKind: "SUPER", actorId: me.id, actorName: me.name, action: isActive ? "superUser.activate" : "superUser.deactivate", entity: "SuperUser", entityId: userId });
    revalidatePath("/super/users");
    return success(isActive ? "User activated." : "User deactivated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

const changePasswordSchema = z.object({
  current: z.string().min(1, "Enter your current password").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  confirm: z.string().max(200),
});

/** Form action for /super/users/password (useActionState). */
export async function changeOwnPassword(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  try {
    const me = await requireSuperAction();
    const parsed = changePasswordSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    if (d.password !== d.confirm) return fail("Passwords do not match.", { confirm: "Passwords do not match." });
    const pw = passwordPolicy(d.password);
    if (pw) return fail(pw, { password: pw });
    if (!(await verifyPassword(d.current, me.passwordHash))) return fail("Current password is incorrect.", { current: "Incorrect password." });
    await db.superUser.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(d.password) } });
    await audit({ actorKind: "SUPER", actorId: me.id, actorName: me.name, action: "superUser.changePassword", entity: "SuperUser", entityId: me.id });
    return success("Password changed.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
