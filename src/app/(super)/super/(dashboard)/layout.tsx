import type { Metadata } from "next";
import { requireSuper } from "@/server/auth/guards";
import { superLogout } from "@/server/auth/actions";
import { superNav } from "@/server/admin-nav";
import { navForRole } from "@/server/super/access";
import { AdminShell } from "@/components/admin/admin-shell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: { default: "Super admin", template: `%s · Super admin | ${brand.name}` },
  robots: { index: false, follow: false, nocache: true },
};

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuper();
  return (
    <AdminShell groups={navForRole(superNav, user.role)} brandLabel={brand.name} brandSub="Super admin" siteUrl="/" userName={user.name} userRole={user.role} logout={superLogout} accent="dark">
      {children}
    </AdminShell>
  );
}
