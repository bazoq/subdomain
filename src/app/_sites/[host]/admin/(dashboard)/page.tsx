import Link from "next/link";
import { ShoppingBag, Banknote, Inbox, Package, ChefHat, Briefcase, Plane, Building2, Users, AlertTriangle } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import { t } from "@/lib/i18n";

export default async function TenantDashboard() {
  const ctx = await requireTenantAdmin();
  const tid = ctx.tenant.id;
  const has = (m: string) => ctx.category.modules.includes(m as never);
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [leadsNew, recentLeads] = await Promise.all([
    db.lead.count({ where: { tenantId: tid, status: "NEW" } }),
    db.lead.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const cards: React.ReactNode[] = [];
  let recent: React.ReactNode = null;

  if (has("ecommerce")) {
    const [pending, revenue, products, lowStock, recentOrders] = await Promise.all([
      db.order.count({ where: { tenantId: tid, status: "PENDING" } }),
      db.order.aggregate({ where: { tenantId: tid, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { total: true }, _count: true }),
      db.product.count({ where: { tenantId: tid, isActive: true } }),
      db.product.count({ where: { tenantId: tid, trackStock: true, stock: { lte: ctx.settings.commerce.lowStockThreshold } } }),
      db.order.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 6 }),
    ]);
    cards.push(
      <StatCard key="pending" label="Pending orders" value={pending} icon={<ShoppingBag />} tone="warning" hint="Awaiting confirmation" />,
      <StatCard key="rev" label="Revenue (30 days)" value={formatPKR(revenue._sum.total ?? 0)} icon={<Banknote />} tone="success" hint={`${revenue._count} orders`} />,
      <StatCard key="prod" label="Active products" value={products} icon={<Package />} tone="info" />,
      <StatCard key="low" label="Low stock" value={lowStock} icon={<AlertTriangle />} tone={lowStock ? "danger" : "default"} />,
    );
    recent = (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {recentOrders.length === 0 ? <p className="p-5 text-sm text-slate-500">No orders yet.</p> : null}
          {recentOrders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  #{ctx.settings.commerce.orderPrefix}-{o.number} · {o.customerName}
                </p>
                <p className="text-xs text-slate-500">
                  {o.city} · {formatDate(o.createdAt, true)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatPKR(o.total)}</span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (has("restaurant")) {
    const [live, revenue, items, recentOrders] = await Promise.all([
      db.foodOrder.count({ where: { tenantId: tid, status: { in: ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } } }),
      db.foodOrder.aggregate({ where: { tenantId: tid, createdAt: { gte: since }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
      db.menuItem.count({ where: { tenantId: tid, isAvailable: true } }),
      db.foodOrder.findMany({ where: { tenantId: tid }, orderBy: { createdAt: "desc" }, take: 6 }),
    ]);
    cards.push(
      <StatCard key="live" label="Live orders" value={live} icon={<ChefHat />} tone="warning" hint="In the kitchen queue" />,
      <StatCard key="rev" label="Sales (30 days)" value={formatPKR(revenue._sum.total ?? 0)} icon={<Banknote />} tone="success" hint={`${revenue._count} orders`} />,
      <StatCard key="items" label="Menu items available" value={items} icon={<Package />} tone="info" />,
      <StatCard
        key="status"
        label="Accepting orders"
        value={ctx.settings.restaurant.acceptingOrders ? "Yes" : "Paused"}
        tone={ctx.settings.restaurant.acceptingOrders ? "success" : "danger"}
      />,
    );
    recent = (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Link href="/admin/kitchen" className="text-sm text-brand-600 hover:underline">
            Open live board
          </Link>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {recentOrders.length === 0 ? <p className="p-5 text-sm text-slate-500">No orders yet.</p> : null}
          {recentOrders.map((o) => (
            <Link key={o.id} href={`/admin/food-orders/${o.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  #{o.number} · {o.customerName} · {o.type.replace("_", " ")}
                </p>
                <p className="text-xs text-slate-500">{formatDate(o.createdAt, true)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatPKR(o.total)}</span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (has("recruiting")) {
    const [jobs, apps, newApps] = await Promise.all([
      db.job.count({ where: { tenantId: tid, isActive: true } }),
      db.application.count({ where: { tenantId: tid, createdAt: { gte: since } } }),
      db.application.count({ where: { tenantId: tid, status: "RECEIVED" } }),
    ]);
    cards.push(
      <StatCard key="jobs" label="Open jobs" value={jobs} icon={<Briefcase />} tone="info" />,
      <StatCard key="apps" label="Applications (30 days)" value={apps} icon={<Users />} tone="success" />,
      <StatCard key="new" label="New applications" value={newApps} icon={<Inbox />} tone="warning" />,
    );
  }
  if (has("travel")) {
    const [pk, bookings] = await Promise.all([
      db.travelPackage.count({ where: { tenantId: tid, isActive: true } }),
      db.booking.count({ where: { tenantId: tid, status: "NEW" } }),
    ]);
    cards.push(
      <StatCard key="pk" label="Active packages" value={pk} icon={<Plane />} tone="info" />,
      <StatCard key="bk" label="New booking requests" value={bookings} icon={<Inbox />} tone="warning" />,
    );
  }
  if (has("realestate")) {
    const props = await db.property.count({ where: { tenantId: tid, isActive: true } });
    cards.push(<StatCard key="props" label="Active listings" value={props} icon={<Building2 />} tone="info" />);
  }
  cards.push(<StatCard key="leads" label="New leads / messages" value={leadsNew} icon={<Inbox />} tone={leadsNew ? "warning" : "default"} />);

  return (
    <>
      <PageHeader title={`Welcome back, ${ctx.user.name.split(" ")[0]}`} description={`${ctx.tenant.name} · ${ctx.category.name}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">{recent}</div>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Latest messages</CardTitle>
            <Link href="/admin/leads" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {recentLeads.length === 0 ? <p className="p-5 text-sm text-slate-500">No messages yet.</p> : null}
            {recentLeads.map((l) => (
              <Link key={l.id} href={`/admin/leads/${l.id}`} className="block px-5 py-3 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{l.name}</p>
                  <StatusBadge status={l.status} />
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{t(l.subject) || l.message || l.formKey}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
