import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSuperSession, getTenantSession } from "@/server/auth/session";
import { getCurrentTenant, type TenantContext } from "@/server/tenant";
import { notFound } from "next/navigation";
import type { SuperUser, TenantUser } from "@/generated/prisma/client";

export interface TenantAdminContext extends TenantContext {
  user: TenantUser;
}

/** For tenant admin pages: resolves tenant from host and requires a matching session. */
export const requireTenantAdmin = cache(async (): Promise<TenantAdminContext> => {
  const tc = await getCurrentTenant();
  if (!tc) notFound();
  const user = await getTenantSession(tc.tenant.id);
  if (!user) redirect("/admin/login");
  return { ...tc, user };
});

/** Same as requireTenantAdmin but for server actions (throws instead of redirecting). */
export const requireTenantAdminAction = cache(async (): Promise<TenantAdminContext> => {
  const tc = await getCurrentTenant();
  if (!tc) throw new Error("Tenant not found");
  const user = await getTenantSession(tc.tenant.id);
  if (!user) throw new Error("Not authenticated");
  return { ...tc, user };
});

export function requireRole(user: TenantUser, roles: TenantUser["role"][]) {
  if (!roles.includes(user.role)) throw new Error("You do not have permission for this action.");
}

/** For super admin pages. */
export const requireSuper = cache(async (): Promise<SuperUser> => {
  const user = await getSuperSession();
  if (!user) redirect("/super/login");
  return user;
});

export const requireSuperAction = cache(async (): Promise<SuperUser> => {
  const user = await getSuperSession();
  if (!user) throw new Error("Not authenticated");
  return user;
});
