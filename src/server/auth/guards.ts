import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSuperSession, getTenantSession } from "@/server/auth/session";
import { getCurrentTenant, type TenantContext } from "@/server/tenant";
import type { SuperUser, TenantUser } from "@/generated/prisma/client";

export interface TenantAdminContext extends TenantContext {
  user: TenantUser;
}

export const SUSPENDED_MESSAGE = "This website is suspended. Please contact support.";

/** Thrown by action guards; `message` is safe to show to the user. */
export class AuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403 = 403,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * For tenant admin pages: resolves tenant from host and requires a matching session.
 * A SUSPENDED tenant's admin is sent to the public site, which renders the suspension notice
 * (the admin area must not be usable while suspended). DRAFT tenants stay manageable so owners
 * can finish setting up before going live.
 */
export const requireTenantAdmin = cache(async (): Promise<TenantAdminContext> => {
  const tc = await getCurrentTenant();
  if (!tc) notFound();
  const user = await getTenantSession(tc.tenant.id);
  if (!user) redirect("/admin/login");
  if (tc.tenant.status === "SUSPENDED") redirect("/");
  return { ...tc, user };
});

/** Same as requireTenantAdmin but for server actions (throws instead of redirecting). */
export const requireTenantAdminAction = cache(async (): Promise<TenantAdminContext> => {
  const tc = await getCurrentTenant();
  if (!tc) throw new AuthError("Tenant not found", 401);
  const user = await getTenantSession(tc.tenant.id);
  if (!user) throw new AuthError("Not authenticated", 401);
  if (tc.tenant.status === "SUSPENDED") throw new AuthError(SUSPENDED_MESSAGE, 403);
  return { ...tc, user };
});

export function requireRole(user: TenantUser, roles: TenantUser["role"][]) {
  if (!roles.includes(user.role)) throw new AuthError("You do not have permission for this action.", 403);
}

/** For super admin pages. */
export const requireSuper = cache(async (): Promise<SuperUser> => {
  const user = await getSuperSession();
  if (!user) redirect("/super/login");
  return user;
});

export const requireSuperAction = cache(async (): Promise<SuperUser> => {
  const user = await getSuperSession();
  if (!user) throw new AuthError("Not authenticated", 401);
  return user;
});

/** Restrict a super action to given platform roles (e.g. only SUPERADMIN may delete tenants). */
export function requireSuperRole(user: SuperUser, roles: SuperUser["role"][]) {
  if (!roles.includes(user.role)) throw new AuthError("You do not have permission for this action.", 403);
}
