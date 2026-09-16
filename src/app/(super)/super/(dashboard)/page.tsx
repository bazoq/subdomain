import Link from "next/link";
import { Globe, LayoutTemplate, Inbox, ShoppingBag, Users } from "lucide-react";
import { requireSuper } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { TEMPLATES } from "@/templates/registry";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/utils";

export default async function SuperDashboard() {
  await requireSuper();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [tenants, active, demo, leads, ordersMonth, foodMonth, recentTenants, recentLeads, byCategory] = await Promise.all([
    db.tenant.count({ where: { isDemo: false } }),
    db.tenant.count({ where: { isDemo: false, status: "ACTIVE" } }),
    db.tenant.count({ where: { isDemo: true } }),
    db.superLead.count({ where: { status: "NEW" } }),
    db.order.count({ where: { createdAt: { gte: since } } }),
    db.foodOrder.count({ where: { createdAt: { gte: since } } }),
    db.tenant.findMany({ where: { isDemo: false }, orderBy: { createdAt: "desc" }, take: 8, include: { domains: true } }),
    db.superLead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.tenant.groupBy({ by: ["category"], where: { isDemo: false }, _count: true }),
  ]);

  return (
    <>
      <PageHeader title="Platform overview" description="Everything happening across your websites." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Customer websites" value={tenants} hint={`${active} active`} icon={<Globe />} tone="info" />
        <StatCard label="Templates" value={TEMPLATES.length} hint={`${demo} demo sites`} icon={<LayoutTemplate />} />
        <StatCard label="Orders (30 days)" value={ordersMonth + foodMonth} hint="Across all stores & restaurants" icon={<ShoppingBag />} tone="success" />
        <StatCard label="New leads" value={leads} icon={<Inbox />} tone={leads ? "warning" : "default"} />
        <StatCard label="Categories" value={CATEGORIES.length} icon={<Users />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recently created websites</CardTitle>
            <Link href="/super/tenants" className="text-sm text-brand-600 hover:underline">
              Manage all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {recentTenants.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                No customer websites yet.{" "}
                <Link href="/super/tenants/new" className="text-brand-600 underline">
                  Create the first one
                </Link>
                .
              </p>
            ) : null}
            {recentTenants.map((tn) => (
              <Link key={tn.id} href={`/super/tenants/${tn.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">{tn.name}</p>
                  <p className="text-xs text-slate-500">
                    {getCategory(tn.category)?.name} · {tn.templateId} · {tn.domains.map((d) => d.hostname).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {formatDate(tn.createdAt)}
                  <StatusBadge status={tn.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Websites by category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byCategory.length === 0 ? <p className="text-sm text-slate-500">—</p> : null}
              {byCategory
                .sort((a, b) => b._count - a._count)
                .map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{getCategory(c.category)?.name ?? c.category}</span>
                    <span className="font-semibold">{c._count}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Latest leads</CardTitle>
              <Link href="/super/leads" className="text-sm text-brand-600 hover:underline">
                All
              </Link>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {recentLeads.length === 0 ? <p className="p-5 text-sm text-slate-500">No leads yet.</p> : null}
              {recentLeads.map((l) => (
                <div key={l.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{l.name}</p>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {l.phone} · {l.business ?? "—"} · {getCategory(l.category ?? "")?.name ?? l.category ?? ""}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
