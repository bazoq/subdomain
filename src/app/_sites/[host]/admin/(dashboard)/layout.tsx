import { requireTenantAdmin } from "@/server/auth/guards";
import { tenantLogout } from "@/server/auth/actions";
import { tenantNav } from "@/server/admin-nav";
import { AdminShell } from "@/components/admin/admin-shell";
import { db } from "@/server/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireTenantAdmin();
  const tid = ctx.tenant.id;
  const has = (m: string) => ctx.category.modules.includes(m as never);

  const [orders, foodOrders, applications, bookings, leads, reservations, prescriptions] = await Promise.all([
    has("ecommerce") ? db.order.count({ where: { tenantId: tid, status: "PENDING" } }) : 0,
    has("restaurant") ? db.foodOrder.count({ where: { tenantId: tid, status: { in: ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } } }) : 0,
    has("recruiting") ? db.application.count({ where: { tenantId: tid, status: "RECEIVED" } }) : 0,
    has("travel") ? db.booking.count({ where: { tenantId: tid, status: "NEW" } }) : 0,
    db.lead.count({ where: { tenantId: tid, status: "NEW" } }),
    has("restaurant") ? db.reservation.count({ where: { tenantId: tid, status: "PENDING" } }) : 0,
    has("medical") ? db.prescription.count({ where: { tenantId: tid, status: "PENDING" } }) : 0,
  ]);

  const groups = tenantNav(ctx.category, { orders, foodOrders, applications, bookings, leads, reservations, prescriptions });

  return (
    <AdminShell
      groups={groups}
      brandLabel={ctx.tenant.name}
      brandSub={ctx.category.name}
      siteUrl="/"
      userName={ctx.user.name}
      userRole={ctx.user.role}
      logout={tenantLogout}
      urduEnabled={ctx.settings.languages.urduEnabled}
    >
      {children}
    </AdminShell>
  );
}
