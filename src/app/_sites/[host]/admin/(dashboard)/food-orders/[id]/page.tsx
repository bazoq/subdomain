import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { requireTenantAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusControls } from "@/components/admin/restaurant/order-status-controls";
import { formatDate, formatPKR, whatsappLink } from "@/lib/utils";
import { orderToken } from "@/modules/ecommerce/order-token";
import { toFoodOrderDto } from "@/modules/restaurant/serialize";

export default async function FoodOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenantAdmin();
  const { id } = await params;
  const row = await db.foodOrder.findFirst({ where: { id, tenantId: ctx.tenant.id }, include: { items: true, customer: { select: { id: true, _count: { select: { foodOrders: true } } } } } });
  if (!row) notFound();
  const o = toFoodOrderDto(row);
  const trackingUrl = `https://${ctx.host}/menu/order/${o.number}?t=${orderToken("food", ctx.tenant.id, o.number)}`;

  return (
    <>
      <PageHeader
        title={`Order #${o.number}`}
        description={`${o.type.replace("_", " ")} · placed ${formatDate(o.createdAt, true)}`}
        backHref="/admin/food-orders"
        actions={
          <Link href={`/admin/food-orders/${o.id}/print`}>
            <Button variant="outline">
              <Printer /> Print ticket
            </Button>
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <StatusBadge status={o.status} />
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                {o.items.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">
                        {i.quantity} × {i.name}
                        {i.sizeName ? <span className="text-slate-500"> ({i.sizeName})</span> : null}
                      </p>
                      {i.modifiers.length ? <p className="text-xs text-slate-500">+ {i.modifiers.map((m) => `${m.name}${m.price ? ` (${formatPKR(m.price)})` : ""}`).join(", ")}</p> : null}
                      {i.note ? <p className="text-xs italic text-amber-700">“{i.note}”</p> : null}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPKR(i.total)}</p>
                      <p className="text-xs text-slate-500">{formatPKR(i.unitPrice)} each</p>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1 border-t border-slate-100 px-5 py-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd>{formatPKR(o.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Delivery fee</dt>
                  <dd>{formatPKR(o.deliveryFee)}</dd>
                </div>
                {o.discount ? (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Discount</dt>
                    <dd>−{formatPKR(o.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between text-base font-bold">
                  <dt>Total ({o.paymentMethod})</dt>
                  <dd>{formatPKR(o.total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusControls id={o.id} status={o.status} type={o.type} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium text-slate-900">{o.customerName}</p>
              <p>
                <a href={`tel:${o.customerPhone}`} className="text-brand-600 hover:underline">
                  {o.customerPhone}
                </a>
                {" · "}
                <a href={whatsappLink(o.customerPhone, `Hi ${o.customerName}, regarding your order #${o.number} at ${ctx.tenant.name}. Track it here: ${trackingUrl}`)} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                  WhatsApp
                </a>
              </p>
              <p className="break-all text-xs text-slate-400">
                Customer tracking link:{" "}
                <a href={trackingUrl} target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
                  {trackingUrl}
                </a>
              </p>
              {o.address ? <p className="text-slate-600">{o.address}</p> : null}
              {o.area ? <p className="text-slate-600">Area: {o.area}</p> : null}
              {o.tableNumber ? <p className="text-slate-600">Table: {o.tableNumber}</p> : null}
              {row.customer ? <p className="text-xs text-slate-500">{row.customer._count.foodOrders} order(s) from this customer</p> : null}
              {o.notes ? <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">{o.notes}</p> : null}
              {o.scheduledFor ? <p className="mt-2 text-sm font-medium text-sky-700">Scheduled for {formatDate(o.scheduledFor, true)}</p> : null}
              {o.estimatedMins ? <p className="text-xs text-slate-500">Estimated {o.estimatedMins} min</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ol className="divide-y divide-slate-100 text-sm">
                {o.timeline.map((e, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 px-5 py-2">
                    <div>
                      <StatusBadge status={e.status} />
                      {e.note ? <p className="mt-1 text-xs text-slate-600">{e.note}</p> : null}
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{formatDate(e.at, true)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
