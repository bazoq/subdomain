import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { orderLabel } from "@/modules/ecommerce/pricing";
import { formatDate, formatPKR, whatsappLink } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireTenantAdmin(), params]);
  const customer = await db.customer.findFirst({
    where: { id, tenantId: ctx.tenant.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 50, include: { _count: { select: { items: true } } } },
      foodOrders: { orderBy: { createdAt: "desc" }, take: 50, include: { _count: { select: { items: true } } } },
    },
  });
  if (!customer) notFound();
  const prefix = ctx.settings.commerce.orderPrefix;
  const shopSpent = customer.orders.filter((o) => !["CANCELLED", "RETURNED"].includes(o.status)).reduce((n, o) => n + o.total, 0);
  const foodSpent = customer.foodOrders.filter((o) => o.status !== "CANCELLED").reduce((n, o) => n + o.total, 0);
  const all = [
    ...customer.orders.map((o) => ({ id: o.id, kind: "shop" as const, label: orderLabel(prefix, o.number), items: o._count.items, total: o.total, status: o.status, createdAt: o.createdAt, href: `/admin/orders/${o.id}` })),
    ...customer.foodOrders.map((o) => ({ id: o.id, kind: "food" as const, label: `#${o.number} · ${o.type.replace("_", " ")}`, items: o._count.items, total: o.total, status: o.status, createdAt: o.createdAt, href: `/admin/food-orders/${o.id}` })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <>
      <PageHeader title={customer.name} description={`Customer since ${formatDate(customer.createdAt)}`} backHref="/admin/customers" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={all.length} />
        <StatCard label="Total spent" value={formatPKR(shopSpent + foodSpent)} tone="success" />
        <StatCard label="Average order" value={all.length ? formatPKR(Math.round((shopSpent + foodSpent) / Math.max(1, all.filter((o) => !["CANCELLED", "RETURNED"].includes(o.status)).length))) : "—"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{customer.phone}</p>
            {customer.email ? <p>{customer.email}</p> : null}
            {customer.address || customer.city ? (
              <p className="whitespace-pre-line text-slate-600">
                {customer.address}
                {customer.address && customer.city ? "\n" : ""}
                {customer.city}
              </p>
            ) : null}
            {customer.notes ? <p className="rounded-md bg-slate-50 p-2 text-xs">{customer.notes}</p> : null}
            <div className="flex gap-2 pt-2">
              <a href={`tel:${customer.phone}`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50">
                <Phone className="size-3.5" /> Call
              </a>
              <a href={whatsappLink(customer.phone)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:brightness-95">
                <MessageCircle className="size-3.5" /> WhatsApp
              </a>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order history</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {all.length === 0 ? <p className="p-5 text-sm text-slate-500">No orders yet.</p> : null}
            {all.map((o) => (
              <Link key={`${o.kind}-${o.id}`} href={o.href} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {o.label} <span className="text-xs font-normal text-slate-500">· {o.items} item{o.items === 1 ? "" : "s"}</span>
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
      </div>
    </>
  );
}
