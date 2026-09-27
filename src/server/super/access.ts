import "server-only";
import { redirect } from "next/navigation";
import { requireSuper } from "@/server/auth/guards";
import type { NavGroup } from "@/components/admin/admin-shell";
import type { SuperUser } from "@/generated/prisma/client";

/**
 * Role model of the super admin.
 *  - SUPERADMIN: everything.
 *  - EDITOR: content only — blog posts and the platform leads inbox (plus their own password).
 * Server actions enforce this with `requireSuperRole`; these helpers keep pages and navigation consistent
 * with it so an editor never sees a screen whose buttons would all fail.
 */

export type SuperRoleName = SuperUser["role"];

/** Path prefixes an EDITOR may open. Everything else under /super is SUPERADMIN only. */
const EDITOR_PREFIXES = ["/super/blog", "/super/leads", "/super/users/password"];

export function canOpenSuperPath(role: SuperRoleName, path: string): boolean {
  if (role === "SUPERADMIN") return true;
  if (path === "/super") return true;
  return EDITOR_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Navigation filtered to what the role may open (empty groups are dropped); editors get an "Account" group for their password. */
export function navForRole(groups: NavGroup[], role: SuperRoleName): NavGroup[] {
  if (role === "SUPERADMIN") return groups;
  const filtered = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => canOpenSuperPath(role, it.href)) }))
    .filter((g) => g.items.length > 0);
  return [...filtered, { title: "Account", items: [{ label: "Change password", href: "/super/users/password", icon: "KeyRound" }] }];
}

/**
 * Page guard: requires a super session AND one of the given roles. Unauthorised users are sent back to
 * the dashboard with `?denied=1` (rendered as a notice there) rather than a bare 403.
 */
export async function requireSuperPage(roles: SuperRoleName[] = ["SUPERADMIN"]): Promise<SuperUser> {
  const user = await requireSuper();
  if (!roles.includes(user.role)) redirect("/super?denied=1");
  return user;
}
