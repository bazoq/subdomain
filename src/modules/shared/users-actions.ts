"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { requireRole, requireTenantAdminAction } from "@/server/auth/guards";
import { generatePassword, hashPassword, passwordPolicy, verifyPassword } from "@/server/auth/password";
import { audit } from "@/server/audit";
import { fail, fromZod, success, type ActionResult } from "@/lib/action-result";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(30)
  .regex(/^[a-z0-9_.-]+$/, "Only lowercase letters, numbers, dot, dash and underscore");

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  username: usernameSchema,
  email: z.string().trim().email("Invalid email").max(120).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "STAFF"]),
  /** blank => generated */
  password: z.string().max(100).optional().or(z.literal("")),
});
export type CreateUserInput = z.infer<typeof createSchema>;

/** Random password that satisfies the policy; shown to the owner once. */
export async function suggestPassword(): Promise<ActionResult<{ password: string }>> {
  return success(undefined, { password: generatePassword(12) });
}

export async function createTenantUser(input: unknown): Promise<ActionResult<{ id: string; password: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    requireRole(ctx.user, ["OWNER"]);
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return fromZod(parsed.error);
    const d = parsed.data;
    const password = d.password || generatePassword(12);
    const policy = passwordPolicy(password);
    if (policy) return fail(policy, { password: policy });
    const clash = await db.tenantUser.findFirst({ where: { tenantId: ctx.tenant.id, username: d.username }, select: { id: true } });
    if (clash) return fail("Username already taken.", { username: "Already taken" });
    const row = await db.tenantUser.create({
      data: { tenantId: ctx.tenant.id, name: d.name, username: d.username, email: d.email || null, role: d.role, passwordHash: await hashPassword(password) },
    });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "user.create", entity: "TenantUser", entityId: row.id, meta: { username: d.username, role: d.role } });
    return success("User added. Share the password now – it will not be shown again.", { id: row.id, password });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function updateTenantUserRole(id: string, role: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    requireRole(ctx.user, ["OWNER"]);
    const r = z.enum(["ADMIN", "STAFF"]).safeParse(role);
    if (!r.success) return fail("Invalid role.");
    const target = await db.tenantUser.findFirst({ where: { id, tenantId: ctx.tenant.id } });
    if (!target) return fail("Not found.");
    if (target.role === "OWNER") return fail("The owner role cannot be changed.");
    await db.tenantUser.update({ where: { id }, data: { role: r.data } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "user.role", entity: "TenantUser", entityId: id, meta: { role: r.data } });
    return success("Role updated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function setTenantUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    requireRole(ctx.user, ["OWNER"]);
    if (id === ctx.user.id && !isActive) return fail("You cannot deactivate your own account.");
    const target = await db.tenantUser.findFirst({ where: { id, tenantId: ctx.tenant.id } });
    if (!target) return fail("Not found.");
    if (!isActive && target.role === "OWNER") {
      const owners = await db.tenantUser.count({ where: { tenantId: ctx.tenant.id, role: "OWNER", isActive: true } });
      if (owners <= 1) return fail("Cannot deactivate the last owner.");
    }
    await db.tenantUser.update({ where: { id }, data: { isActive, ...(isActive ? { failedLogins: 0, lockedUntil: null } : {}) } });
    if (!isActive) await db.session.deleteMany({ where: { tenantUserId: id, tenantId: ctx.tenant.id } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: isActive ? "user.activate" : "user.deactivate", entity: "TenantUser", entityId: id });
    return success(isActive ? "User activated." : "User deactivated.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteTenantUser(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    requireRole(ctx.user, ["OWNER"]);
    if (id === ctx.user.id) return fail("You cannot remove your own account.");
    const target = await db.tenantUser.findFirst({ where: { id, tenantId: ctx.tenant.id } });
    if (!target) return fail("Not found.");
    if (target.role === "OWNER") {
      const owners = await db.tenantUser.count({ where: { tenantId: ctx.tenant.id, role: "OWNER" } });
      if (owners <= 1) return fail("Cannot remove the last owner.");
    }
    await db.tenantUser.delete({ where: { id } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "user.delete", entity: "TenantUser", entityId: id, meta: { username: target.username } });
    return success("User removed.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/** Owner resets another user's password; returns the new password once. */
export async function resetTenantUserPassword(id: string, newPassword?: string): Promise<ActionResult<{ password: string }>> {
  try {
    const ctx = await requireTenantAdminAction();
    requireRole(ctx.user, ["OWNER"]);
    const target = await db.tenantUser.findFirst({ where: { id, tenantId: ctx.tenant.id } });
    if (!target) return fail("Not found.");
    const password = (newPassword ?? "").trim() || generatePassword(12);
    const policy = passwordPolicy(password);
    if (policy) return fail(policy);
    await db.tenantUser.update({ where: { id }, data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null } });
    await db.session.deleteMany({ where: { tenantUserId: id, tenantId: ctx.tenant.id } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "user.password_reset", entity: "TenantUser", entityId: id });
    return success("Password reset. Share it now – it will not be shown again.", { password });
  } catch (e) {
    return fail((e as Error).message);
  }
}

const changeSchema = z.object({
  current: z.string().min(1, "Enter your current password"),
  password: z.string().min(1, "Enter a new password"),
  confirm: z.string(),
});

/** Any signed-in user changes their own password (form action). */
export async function changeOwnPassword(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await requireTenantAdminAction();
    const parsed = changeSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return fromZod(parsed.error);
    const { current, password, confirm } = parsed.data;
    if (password !== confirm) return fail("Passwords do not match.", { confirm: "Passwords do not match" });
    const policy = passwordPolicy(password);
    if (policy) return fail(policy, { password: policy });
    const ok = await verifyPassword(current, ctx.user.passwordHash);
    if (!ok) return fail("Current password is incorrect.", { current: "Incorrect password" });
    await db.tenantUser.update({ where: { id: ctx.user.id }, data: { passwordHash: await hashPassword(password) } });
    await audit({ tenantId: ctx.tenant.id, actorKind: "TENANT", actorId: ctx.user.id, actorName: ctx.user.name, action: "user.password_change", entity: "TenantUser", entityId: ctx.user.id });
    return success("Password changed.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
