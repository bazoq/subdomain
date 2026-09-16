import { requireSuper } from "@/server/auth/guards";
import { superLogout } from "@/server/auth/actions";
import { superNav } from "@/server/admin-nav";
import { AdminShell } from "@/components/admin/admin-shell";
import { brand } from "@/config/brand";

export const metadata = { robots: { index: false, follow: false } };

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuper();
  return (
    <AdminShell groups={superNav} brandLabel={brand.name} brandSub="Super admin" siteUrl="/" userName={user.name} userRole={user.role} logout={superLogout} accent="dark">
      {children}
    </AdminShell>
  );
}
